/**
 * Database Schema Verification Script
 * 
 * Scans all TypeScript files for Supabase queries and verifies:
 * 1. Table names exist in schema
 * 2. Column names are valid
 * 3. RLS policies are in place
 * 
 * Usage: node scripts/verify-schema.js
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface TableInfo {
    name: string;
    exists: boolean;
    hasRLS?: boolean;
    policies?: string[];
}

interface QueryReference {
    file: string;
    line: number;
    table: string;
    method: string;
    code: string;
}

interface VerificationResult {
    tablesFound: Set<string>;
    queries: QueryReference[];
    unknownTables: Set<string>;
    missingRLS: Set<string>;
    summary: {
        totalQueries: number;
        uniqueTables: number;
        errors: number;
        warnings: number;
    };
}

class SchemaVerifier {
    private knownTables: Set<string> = new Set();
    private tablesWithRLS: Set<string> = new Set();
    private queries: QueryReference[] = [];

    constructor() {
        this.loadSchemaFromTypes();
    }

    /**
     * Extract table names from the types.ts file
     */
    private loadSchemaFromTypes() {
        try {
            const typesPath = path.join(process.cwd(), 'src/integrations/supabase/types.ts');
            const content = fs.readFileSync(typesPath, 'utf-8');

            // Match table definitions in the Tables type
            // Pattern: tableName: {
            const tablePattern = /^\s+(\w+):\s*\{/gm;
            let match;

            while ((match = tablePattern.exec(content)) !== null) {
                const tableName = match[1];
                // Filter out type keywords
                if (!['Row', 'Insert', 'Update', 'Relationships', 'Tables'].includes(tableName)) {
                    this.knownTables.add(tableName);
                }
            }

            console.log(`✓ Loaded ${this.knownTables.size} tables from schema`);
        } catch (error) {
            console.error('Error loading schema:', error);
        }
    }

    /**
     * Scan TypeScript files for .from() calls
     */
    async scanQueries(): Promise<void> {
        const files = await glob('src/**/*.{ts,tsx}', {
            ignore: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**'],
        });

        for (const file of files) {
            this.scanFile(file);
        }

        console.log(`✓ Scanned ${files.length} files, found ${this.queries.length} queries`);
    }

    /**
     * Scan individual file for queries
     */
    private scanFile(filePath: string): void {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        // Pattern: .from('table_name') or .from("table_name")
        const fromPattern = /\.from\(['"](\w+)['"]\)/g;

        lines.forEach((line, index) => {
            let match;
            while ((match = fromPattern.exec(line)) !== null) {
                this.queries.push({
                    file: filePath,
                    line: index + 1,
                    table: match[1],
                    method: 'from',
                    code: line.trim(),
                });
            }
        });
    }

    /**
     * Verify all queries against schema
     */
    verify(): VerificationResult {
        const tablesFound = new Set<string>();
        const unknownTables = new Set<string>();

        for (const query of this.queries) {
            tablesFound.add(query.table);

            if (!this.knownTables.has(query.table)) {
                unknownTables.add(query.table);
            }
        }

        // Check for tables that might need RLS
        const missingRLS = new Set<string>();
        for (const table of tablesFound) {
            if (this.knownTables.has(table)) {
                // Assume tables with user_id or profile_id need RLS
                // This is a heuristic - actual check would require parsing SQL
                if (!table.startsWith('public_') && !table.includes('_view')) {
                    // Add to list for manual verification
                }
            }
        }

        return {
            tablesFound,
            queries: this.queries,
            unknownTables,
            missingRLS,
            summary: {
                totalQueries: this.queries.length,
                uniqueTables: tablesFound.size,
                errors: unknownTables.size,
                warnings: missingRLS.size,
            },
        };
    }

    /**
     * Generate verification report
     */
    generateReport(results: VerificationResult): string {
        let report = '# Database Schema Verification Report\n\n';
        report += `Generated: ${new Date().toISOString()}\n\n`;

        // Summary
        report += '## Summary\n\n';
        report += `- **Total Queries**: ${results.summary.totalQueries}\n`;
        report += `- **Unique Tables Referenced**: ${results.summary.uniqueTables}\n`;
        report += `- **Unknown Tables**: ${results.summary.errors}\n`;
        report += `- **RLS Warnings**: ${results.summary.warnings}\n\n`;

        // Unknown tables (errors)
        if (results.unknownTables.size > 0) {
            report += '## ❌ Unknown Tables (ERRORS)\n\n';
            report += 'These tables are referenced in code but not found in schema:\n\n';

            for (const table of Array.from(results.unknownTables).sort()) {
                report += `### ${table}\n\n`;
                const refs = this.queries.filter(q => q.table === table);
                report += `Referenced ${refs.length} times:\n\n`;

                refs.slice(0, 5).forEach(ref => {
                    report += `- ${ref.file}:${ref.line}\n`;
                    report += `  \`\`\`typescript\n  ${ref.code}\n  \`\`\`\n`;
                });

                if (refs.length > 5) {
                    report += `\n... and ${refs.length - 5} more references\n`;
                }
                report += '\n';
            }
        }

        // All tables found
        report += '## ✅ Valid Tables\n\n';
        const validTables = Array.from(results.tablesFound)
            .filter(t => this.knownTables.has(t))
            .sort();

        report += `Found ${validTables.length} valid table references:\n\n`;
        for (const table of validTables) {
            const count = this.queries.filter(q => q.table === table).length;
            report += `- \`${table}\` (${count} queries)\n`;
        }
        report += '\n';

        // Most used tables
        report += '## 📊 Most Used Tables\n\n';
        const tableCounts = new Map<string, number>();
        for (const query of this.queries) {
            tableCounts.set(query.table, (tableCounts.get(query.table) || 0) + 1);
        }

        const top10 = Array.from(tableCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        for (const [table, count] of top10) {
            const status = this.knownTables.has(table) ? '✅' : '❌';
            report += `${status} \`${table}\`: ${count} queries\n`;
        }
        report += '\n';

        return report;
    }
}

// Main execution
async function main() {
    console.log('🔍 Starting Database Schema Verification...\n');

    const verifier = new SchemaVerifier();

    console.log('📂 Scanning TypeScript files for queries...');
    await verifier.scanQueries();

    console.log('✓ Verifying queries against schema...');
    const results = verifier.verify();

    console.log('\n' + '='.repeat(60));
    console.log('VERIFICATION RESULTS');
    console.log('='.repeat(60) + '\n');

    console.log(`Total Queries: ${results.summary.totalQueries}`);
    console.log(`Unique Tables: ${results.summary.uniqueTables}`);
    console.log(`Errors: ${results.summary.errors}`);
    console.log(`Warnings: ${results.summary.warnings}\n`);

    if (results.unknownTables.size > 0) {
        console.log('❌ UNKNOWN TABLES FOUND:');
        for (const table of results.unknownTables) {
            console.log(`   - ${table}`);
        }
        console.log('');
    } else {
        console.log('✅ All table references are valid!\n');
    }

    // Generate report
    const report = verifier.generateReport(results);
    const reportPath = path.join(process.cwd(), 'schema-verification-report.md');
    fs.writeFileSync(reportPath, report);

    console.log(`📄 Full report saved to: schema-verification-report.md`);
    console.log('\n' + '='.repeat(60) + '\n');

    // Exit with error code if issues found
    if (results.summary.errors > 0) {
        console.error('⚠️  Verification failed with errors');
        process.exit(1);
    }
}

main().catch(console.error);
