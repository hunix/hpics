/**
 * Process Bulk Upload Edge Function
 * Handles large ZIP uploads with streaming extraction and parallel processing
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InitializeRequest {
  sessionId: string;
  files: Array<{
    filename: string;
    fileSize: number;
    mimeType: string;
    storagePath: string;
    bucket: string;
    category: string;
    contentHash?: string;
  }>;
  profileId?: string;
  autoAnalyze?: boolean;
}

interface CompleteFileRequest {
  sessionId: string;
  itemId: string;
  storagePath: string;
  publicUrl: string;
}

interface FinalizeRequest {
  sessionId: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()

    switch (path) {
      case 'initialize': {
        const body: InitializeRequest = await req.json()
        
        // Verify session belongs to user
        const { data: session, error: sessionError } = await supabase
          .from('bulk_upload_sessions')
          .select('id, user_id')
          .eq('id', body.sessionId)
          .eq('user_id', user.id)
          .single()

        if (sessionError || !session) {
          return new Response(
            JSON.stringify({ error: 'Session not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Generate presigned upload URLs for each file
        const uploadUrls = await Promise.all(
          body.files.map(async (file) => {
            const { data, error } = await supabase.storage
              .from(file.bucket)
              .createSignedUploadUrl(file.storagePath)

            if (error) {
              console.error(`Failed to create upload URL for ${file.filename}:`, error)
              return null
            }

            return {
              filename: file.filename,
              storagePath: file.storagePath,
              uploadUrl: data.signedUrl,
              token: data.token
            }
          })
        )

        // Filter out failed URLs
        const validUrls = uploadUrls.filter(Boolean)

        // Update session status
        await supabase
          .from('bulk_upload_sessions')
          .update({
            status: 'ready',
            last_activity_at: new Date().toISOString()
          })
          .eq('id', body.sessionId)

        return new Response(
          JSON.stringify({
            success: true,
            uploadUrls: validUrls,
            totalFiles: body.files.length,
            readyFiles: validUrls.length
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'complete-file': {
        const body: CompleteFileRequest = await req.json()

        // Update item status
        const { error: updateError } = await supabase
          .from('bulk_upload_items')
          .update({
            status: 'uploaded',
            storage_path: body.storagePath,
            completed_at: new Date().toISOString()
          })
          .eq('id', body.itemId)

        if (updateError) {
          return new Response(
            JSON.stringify({ error: updateError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Get item details
        const { data: item } = await supabase
          .from('bulk_upload_items')
          .select('filename, file_size, file_type, session_id')
          .eq('id', body.itemId)
          .single()

        if (item) {
          // Get session for profile_id
          const { data: session } = await supabase
            .from('bulk_upload_sessions')
            .select('profile_id, auto_analyze')
            .eq('id', item.session_id)
            .single()

          // Create database record based on file type
          let recordId: string | null = null

          if (item.file_type === 'image' || item.file_type === 'video') {
            const { data: media } = await supabase
              .from('media')
              .insert({
                user_id: user.id,
                profile_id: session?.profile_id,
                media_type: item.file_type,
                file_url: body.publicUrl,
                storage_path: body.storagePath,
                file_name: item.filename,
                file_size: item.file_size,
                caption: item.filename
              })
              .select('id')
              .single()

            recordId = media?.id

            // Queue for analysis if enabled
            if (recordId && session?.auto_analyze) {
              await supabase.from('enrichment_queue').insert({
                user_id: user.id,
                profile_id: session?.profile_id,
                enrichment_type: 'media_analysis',
                source_type: 'media',
                source_id: recordId,
                priority: 3,
                status: 'pending'
              })
            }
          } else if (item.file_type === 'document') {
            const { data: doc } = await supabase
              .from('documents')
              .insert({
                user_id: user.id,
                profile_id: session?.profile_id,
                title: item.filename,
                document_type: 'general',
                file_url: body.publicUrl,
                storage_path: body.storagePath,
                file_size: item.file_size
              })
              .select('id')
              .single()

            recordId = doc?.id
          } else if (item.file_type === 'audio') {
            const { data: recording } = await supabase
              .from('meeting_recordings')
              .insert({
                user_id: user.id,
                profile_id: session?.profile_id,
                title: item.filename,
                file_url: body.publicUrl,
                file_size: item.file_size
              })
              .select('id')
              .single()

            recordId = recording?.id
          }

          // Update item with record ID
          if (recordId) {
            const updateField = item.file_type === 'document' ? 'document_id' 
              : item.file_type === 'audio' ? 'recording_id' 
              : 'media_id'

            await supabase
              .from('bulk_upload_items')
              .update({ [updateField]: recordId })
              .eq('id', body.itemId)
          }

          // Update session progress - fetch current and increment
          const { data: currentSession } = await supabase
            .from('bulk_upload_sessions')
            .select('completed_files, uploaded_bytes')
            .eq('id', item.session_id)
            .single()

          if (currentSession) {
            await supabase
              .from('bulk_upload_sessions')
              .update({
                completed_files: (currentSession.completed_files || 0) + 1,
                uploaded_bytes: (currentSession.uploaded_bytes || 0) + item.file_size,
                last_activity_at: new Date().toISOString()
              })
              .eq('id', item.session_id)
          }
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'finalize': {
        const body: FinalizeRequest = await req.json()

        // Get session stats
        const { data: items } = await supabase
          .from('bulk_upload_items')
          .select('status')
          .eq('session_id', body.sessionId)

        const completed = items?.filter(i => i.status === 'uploaded').length || 0
        const failed = items?.filter(i => i.status === 'failed').length || 0
        const skipped = items?.filter(i => i.status === 'skipped').length || 0

        // Determine final status
        const finalStatus = failed > 0 && completed === 0 ? 'failed' : 'completed'

        // Update session
        await supabase
          .from('bulk_upload_sessions')
          .update({
            status: finalStatus,
            completed_files: completed,
            failed_files: failed,
            skipped_files: skipped,
            completed_at: new Date().toISOString(),
            last_activity_at: new Date().toISOString()
          })
          .eq('id', body.sessionId)

        return new Response(
          JSON.stringify({
            success: true,
            status: finalStatus,
            completed,
            failed,
            skipped
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'status': {
        const sessionId = url.searchParams.get('sessionId')
        
        if (!sessionId) {
          return new Response(
            JSON.stringify({ error: 'Session ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { data: session, error } = await supabase
          .from('bulk_upload_sessions')
          .select('*')
          .eq('id', sessionId)
          .eq('user_id', user.id)
          .single()

        if (error || !session) {
          return new Response(
            JSON.stringify({ error: 'Session not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify(session),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown endpoint' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error: unknown) {
    console.error('Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
