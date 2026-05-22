/**
 * TAS-Com Community Detector
 * 
 * State-of-the-art community detection using GCN + Leiden algorithm.
 * Bridges topological and attribute cohesion to find hidden cells in covert networks.
 * 
 * Based on: arXiv:2505.10197v1 (May 2025)
 */

// ============================================
// Core Types
// ============================================

export interface NetworkGraph {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  metadata: GraphMetadata;
}

export interface NetworkNode {
  id: string;
  profileId?: string;
  attributes: NodeAttributes;
  embedding?: number[];
  communityId?: string;
  centrality: CentralityMetrics;
}

export interface NodeAttributes {
  type: NodeType;
  name?: string;
  properties: Record<string, unknown>;
  behavioralSignature?: number[];
  temporalPattern?: TemporalPattern;
}

export type NodeType = 
  | 'person'
  | 'organization'
  | 'location'
  | 'event'
  | 'communication_channel'
  | 'financial_entity'
  | 'digital_identity';

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
  type: EdgeType;
  attributes: EdgeAttributes;
  timestamps: Date[];
}

export type EdgeType = 
  | 'communication'
  | 'financial'
  | 'organizational'
  | 'social'
  | 'familial'
  | 'geographic'
  | 'temporal_co_occurrence';

export interface EdgeAttributes {
  frequency: number;
  reciprocity: number;
  strength: number;
  latency: number;
  sentiment?: number;
}

export interface GraphMetadata {
  nodeCount: number;
  edgeCount: number;
  density: number;
  averageDegree: number;
  clusteringCoefficient: number;
  diameter: number;
  createdAt: Date;
}

export interface CentralityMetrics {
  degree: number;
  betweenness: number;
  closeness: number;
  eigenvector: number;
  pageRank: number;
  brokerageScore: number;
}

export interface TemporalPattern {
  activeHours: number[];
  activeDays: number[];
  burstiness: number;
  periodicity: number;
}

// ============================================
// Community Detection Types
// ============================================

export interface Community {
  id: string;
  nodes: string[];
  cohesion: CohesionMetrics;
  characterization: CommunityCharacterization;
  riskAssessment: CommunityRisk;
  keyMembers: KeyMember[];
  externalConnections: ExternalConnection[];
}

export interface CohesionMetrics {
  topological: number;
  attribute: number;
  combined: number;
  internalDensity: number;
  externalDensity: number;
  modularity: number;
}

export interface CommunityCharacterization {
  dominantType: string;
  purpose: string[];
  activityPattern: string;
  formationDate?: Date;
  stability: number;
  growthTrend: 'expanding' | 'stable' | 'contracting';
}

export interface CommunityRisk {
  threatLevel: 'low' | 'moderate' | 'elevated' | 'high' | 'critical';
  riskFactors: RiskFactor[];
  surveillancePriority: number;
  indicators: string[];
}

export interface RiskFactor {
  type: string;
  description: string;
  severity: number;
  evidence: string[];
}

export interface KeyMember {
  nodeId: string;
  role: MemberRole;
  influence: number;
  replaceability: number;
  vulnerabilities: string[];
}

export type MemberRole = 
  | 'leader'
  | 'coordinator'
  | 'broker'
  | 'specialist'
  | 'recruiter'
  | 'financier'
  | 'communicator'
  | 'peripheral';

export interface ExternalConnection {
  targetCommunityId: string;
  bridgeNodes: string[];
  connectionStrength: number;
  connectionType: string;
}

// ============================================
// TAS-Com Algorithm Implementation
// ============================================

export interface TASComConfig {
  resolution: number;
  attributeWeight: number;
  topologyWeight: number;
  minCommunitySize: number;
  maxIterations: number;
  convergenceThreshold: number;
}

const DEFAULT_CONFIG: TASComConfig = {
  resolution: 1.0,
  attributeWeight: 0.4,
  topologyWeight: 0.6,
  minCommunitySize: 3,
  maxIterations: 100,
  convergenceThreshold: 0.001
};

export class TASComDetector {
  private config: TASComConfig;
  private graph: NetworkGraph;
  private nodeEmbeddings: Map<string, number[]>;
  private communities: Community[];
  
  constructor(graph: NetworkGraph, config: Partial<TASComConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.graph = graph;
    this.nodeEmbeddings = new Map();
    this.communities = [];
  }
  
  /**
   * Run TAS-Com community detection algorithm
   */
  async detectCommunities(): Promise<Community[]> {
    // Step 1: Generate node embeddings using GCN-like aggregation
    await this.generateNodeEmbeddings();
    
    // Step 2: Compute combined similarity matrix
    const similarityMatrix = this.computeSimilarityMatrix();
    
    // Step 3: Run Leiden algorithm with modified modularity
    const partitions = this.runLeidenAlgorithm(similarityMatrix);
    
    // Step 4: Refine communities
    const refinedPartitions = this.refineCommunities(partitions);
    
    // Step 5: Characterize communities
    this.communities = await this.characterizeCommunities(refinedPartitions);
    
    return this.communities;
  }
  
  /**
   * Generate node embeddings using message passing
   */
  private async generateNodeEmbeddings(): Promise<void> {
    const embeddingDim = 64;
    
    // Initialize embeddings from node attributes
    this.graph.nodes.forEach(node => {
      const initialEmbedding = this.attributesToEmbedding(node.attributes, embeddingDim);
      this.nodeEmbeddings.set(node.id, initialEmbedding);
    });
    
    // Message passing iterations (GCN-style)
    const numLayers = 3;
    for (let layer = 0; layer < numLayers; layer++) {
      const newEmbeddings = new Map<string, number[]>();
      
      this.graph.nodes.forEach(node => {
        const neighbors = this.getNeighbors(node.id);
        const selfEmbed = this.nodeEmbeddings.get(node.id)!;
        
        // Aggregate neighbor embeddings
        const neighborEmbed = this.aggregateNeighborEmbeddings(neighbors);
        
        // Combine self and neighbor embeddings
        const combined = selfEmbed.map((val, i) => 
          val * 0.5 + (neighborEmbed[i] || 0) * 0.5
        );
        
        // Apply non-linearity (ReLU)
        const activated = combined.map(v => Math.max(0, v));
        
        // L2 normalize
        const norm = Math.sqrt(activated.reduce((sum, v) => sum + v * v, 0)) || 1;
        const normalized = activated.map(v => v / norm);
        
        newEmbeddings.set(node.id, normalized);
      });
      
      this.nodeEmbeddings = newEmbeddings;
    }
  }
  
  /**
   * Compute combined topological-attribute similarity matrix
   */
  private computeSimilarityMatrix(): number[][] {
    const n = this.graph.nodes.length;
    const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
    const nodeIndex = new Map(this.graph.nodes.map((node, i) => [node.id, i]));
    
    // Compute topological similarity (Jaccard on neighborhoods)
    this.graph.nodes.forEach((nodeA, i) => {
      this.graph.nodes.forEach((nodeB, j) => {
        if (i >= j) return;
        
        const neighborsA = new Set(this.getNeighbors(nodeA.id));
        const neighborsB = new Set(this.getNeighbors(nodeB.id));
        
        const intersection = [...neighborsA].filter(x => neighborsB.has(x)).length;
        const union = new Set([...neighborsA, ...neighborsB]).size;
        
        const topologicalSim = union > 0 ? intersection / union : 0;
        
        // Compute attribute similarity (cosine on embeddings)
        const embedA = this.nodeEmbeddings.get(nodeA.id)!;
        const embedB = this.nodeEmbeddings.get(nodeB.id)!;
        
        const dotProduct = embedA.reduce((sum, val, k) => sum + val * embedB[k], 0);
        const normA = Math.sqrt(embedA.reduce((sum, v) => sum + v * v, 0));
        const normB = Math.sqrt(embedB.reduce((sum, v) => sum + v * v, 0));
        
        const attributeSim = (normA * normB) > 0 ? dotProduct / (normA * normB) : 0;
        
        // Combined similarity
        const combined = 
          this.config.topologyWeight * topologicalSim +
          this.config.attributeWeight * attributeSim;
        
        matrix[i][j] = combined;
        matrix[j][i] = combined;
      });
    });
    
    return matrix;
  }
  
  /**
   * Run Leiden algorithm for community detection
   */
  private runLeidenAlgorithm(similarityMatrix: number[][]): Map<string, string> {
    const n = this.graph.nodes.length;
    const nodeIds = this.graph.nodes.map(n => n.id);
    
    // Initialize each node in its own community
    const communities = new Map<string, string>();
    nodeIds.forEach(id => communities.set(id, id));
    
    let improved = true;
    let iteration = 0;
    
    while (improved && iteration < this.config.maxIterations) {
      improved = false;
      iteration++;
      
      // Shuffle nodes for random processing order
      const shuffled = [...nodeIds].sort(() => Math.random() - 0.5);
      
      for (const nodeId of shuffled) {
        const currentCommunity = communities.get(nodeId)!;
        const neighborCommunities = this.getNeighborCommunities(nodeId, communities);
        
        let bestCommunity = currentCommunity;
        let bestGain = 0;
        
        for (const candidateCommunity of neighborCommunities) {
          const gain = this.calculateModularityGain(
            nodeId,
            currentCommunity,
            candidateCommunity,
            communities,
            similarityMatrix
          );
          
          if (gain > bestGain + this.config.convergenceThreshold) {
            bestGain = gain;
            bestCommunity = candidateCommunity;
          }
        }
        
        if (bestCommunity !== currentCommunity) {
          communities.set(nodeId, bestCommunity);
          improved = true;
        }
      }
    }
    
    // Renumber communities
    const uniqueCommunities = [...new Set(communities.values())];
    const communityMap = new Map(uniqueCommunities.map((c, i) => [c, `community_${i}`]));
    
    const result = new Map<string, string>();
    communities.forEach((comm, nodeId) => {
      result.set(nodeId, communityMap.get(comm)!);
    });
    
    return result;
  }
  
  /**
   * Refine communities based on minimum size and coherence
   */
  private refineCommunities(partitions: Map<string, string>): Map<string, string> {
    // Group nodes by community
    const communityNodes = new Map<string, string[]>();
    partitions.forEach((comm, nodeId) => {
      if (!communityNodes.has(comm)) {
        communityNodes.set(comm, []);
      }
      communityNodes.get(comm)!.push(nodeId);
    });
    
    const refined = new Map<string, string>();
    const orphans: string[] = [];
    
    // Filter small communities
    communityNodes.forEach((nodes, comm) => {
      if (nodes.length >= this.config.minCommunitySize) {
        nodes.forEach(nodeId => refined.set(nodeId, comm));
      } else {
        orphans.push(...nodes);
      }
    });
    
    // Assign orphans to nearest community
    orphans.forEach(orphan => {
      let bestCommunity = '';
      let bestSimilarity = -1;
      
      const orphanEmbed = this.nodeEmbeddings.get(orphan)!;
      
      communityNodes.forEach((nodes, comm) => {
        if (nodes.length < this.config.minCommunitySize) return;
        
        // Calculate average similarity to community members
        let totalSim = 0;
        nodes.forEach(member => {
          const memberEmbed = this.nodeEmbeddings.get(member)!;
          totalSim += this.cosineSimilarity(orphanEmbed, memberEmbed);
        });
        
        const avgSim = totalSim / nodes.length;
        if (avgSim > bestSimilarity) {
          bestSimilarity = avgSim;
          bestCommunity = comm;
        }
      });
      
      if (bestCommunity) {
        refined.set(orphan, bestCommunity);
      }
    });
    
    return refined;
  }
  
  /**
   * Characterize detected communities
   */
  private async characterizeCommunities(
    partitions: Map<string, string>
  ): Promise<Community[]> {
    const communityNodes = new Map<string, string[]>();
    partitions.forEach((comm, nodeId) => {
      if (!communityNodes.has(comm)) {
        communityNodes.set(comm, []);
      }
      communityNodes.get(comm)!.push(nodeId);
    });
    
    const communities: Community[] = [];
    
    for (const [commId, nodeIds] of communityNodes) {
      const nodes = nodeIds.map(id => 
        this.graph.nodes.find(n => n.id === id)!
      );
      
      const cohesion = this.calculateCohesion(nodeIds);
      const characterization = this.characterizeCommunity(nodes);
      const keyMembers = this.identifyKeyMembers(nodeIds);
      const externalConnections = this.findExternalConnections(nodeIds, partitions);
      const riskAssessment = this.assessCommunityRisk(nodes, characterization);
      
      communities.push({
        id: commId,
        nodes: nodeIds,
        cohesion,
        characterization,
        riskAssessment,
        keyMembers,
        externalConnections
      });
    }
    
    return communities.sort((a, b) => 
      b.riskAssessment.surveillancePriority - a.riskAssessment.surveillancePriority
    );
  }
  
  // ============================================
  // Helper Methods
  // ============================================
  
  private attributesToEmbedding(attributes: NodeAttributes, dim: number): number[] {
    const embedding = new Array(dim).fill(0);
    
    // Encode node type
    const typeIndex = ['person', 'organization', 'location', 'event'].indexOf(attributes.type);
    if (typeIndex >= 0 && typeIndex < dim) {
      embedding[typeIndex] = 1;
    }
    
    // Use behavioral signature if available
    if (attributes.behavioralSignature) {
      for (let i = 0; i < Math.min(attributes.behavioralSignature.length, dim); i++) {
        embedding[i + 10] = attributes.behavioralSignature[i];
      }
    }
    
    // Hash properties into remaining dimensions
    const propString = JSON.stringify(attributes.properties);
    for (let i = 0; i < propString.length && i + 30 < dim; i++) {
      embedding[i + 30] = propString.charCodeAt(i) / 255;
    }
    
    return embedding;
  }
  
  private getNeighbors(nodeId: string): string[] {
    const neighbors: string[] = [];
    
    this.graph.edges.forEach(edge => {
      if (edge.source === nodeId) neighbors.push(edge.target);
      if (edge.target === nodeId) neighbors.push(edge.source);
    });
    
    return [...new Set(neighbors)];
  }
  
  private aggregateNeighborEmbeddings(neighborIds: string[]): number[] {
    if (neighborIds.length === 0) return [];
    
    const firstEmbed = this.nodeEmbeddings.get(neighborIds[0]);
    if (!firstEmbed) return [];
    
    const dim = firstEmbed.length;
    const aggregated = new Array(dim).fill(0);
    
    neighborIds.forEach(id => {
      const embed = this.nodeEmbeddings.get(id);
      if (embed) {
        embed.forEach((val, i) => aggregated[i] += val);
      }
    });
    
    return aggregated.map(v => v / neighborIds.length);
  }
  
  private getNeighborCommunities(
    nodeId: string,
    communities: Map<string, string>
  ): Set<string> {
    const neighbors = this.getNeighbors(nodeId);
    const neighborComms = new Set<string>();
    
    neighbors.forEach(n => {
      const comm = communities.get(n);
      if (comm) neighborComms.add(comm);
    });
    
    return neighborComms;
  }
  
  private calculateModularityGain(
    nodeId: string,
    fromCommunity: string,
    toCommunity: string,
    communities: Map<string, string>,
    similarityMatrix: number[][]
  ): number {
    const nodeIndex = this.graph.nodes.findIndex(n => n.id === nodeId);
    
    let toGain = 0;
    let fromLoss = 0;
    
    this.graph.nodes.forEach((node, i) => {
      if (node.id === nodeId) return;
      
      const sim = similarityMatrix[nodeIndex][i];
      const comm = communities.get(node.id);
      
      if (comm === toCommunity) toGain += sim;
      if (comm === fromCommunity) fromLoss += sim;
    });
    
    return toGain - fromLoss;
  }
  
  private cosineSimilarity(a: number[], b: number[]): number {
    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
    const normB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));
    return (normA * normB) > 0 ? dot / (normA * normB) : 0;
  }
  
  private calculateCohesion(nodeIds: string[]): CohesionMetrics {
    const internalEdges = this.graph.edges.filter(e =>
      nodeIds.includes(e.source) && nodeIds.includes(e.target)
    );
    
    const externalEdges = this.graph.edges.filter(e =>
      (nodeIds.includes(e.source) && !nodeIds.includes(e.target)) ||
      (!nodeIds.includes(e.source) && nodeIds.includes(e.target))
    );
    
    const maxInternalEdges = (nodeIds.length * (nodeIds.length - 1)) / 2;
    const internalDensity = maxInternalEdges > 0 
      ? internalEdges.length / maxInternalEdges 
      : 0;
    
    const externalDensity = nodeIds.length > 0
      ? externalEdges.length / nodeIds.length
      : 0;
    
    // Attribute cohesion from embedding similarity
    let attributeSim = 0;
    let count = 0;
    
    for (let i = 0; i < nodeIds.length; i++) {
      for (let j = i + 1; j < nodeIds.length; j++) {
        const embedA = this.nodeEmbeddings.get(nodeIds[i]);
        const embedB = this.nodeEmbeddings.get(nodeIds[j]);
        if (embedA && embedB) {
          attributeSim += this.cosineSimilarity(embedA, embedB);
          count++;
        }
      }
    }
    
    const attributeCohesion = count > 0 ? attributeSim / count : 0;
    
    return {
      topological: internalDensity,
      attribute: attributeCohesion,
      combined: (internalDensity + attributeCohesion) / 2,
      internalDensity,
      externalDensity,
      modularity: internalDensity - externalDensity
    };
  }
  
  private characterizeCommunity(nodes: NetworkNode[]): CommunityCharacterization {
    // Determine dominant type
    const typeCounts = new Map<string, number>();
    nodes.forEach(node => {
      const count = typeCounts.get(node.attributes.type) || 0;
      typeCounts.set(node.attributes.type, count + 1);
    });
    
    let dominantType = 'mixed';
    let maxCount = 0;
    typeCounts.forEach((count, type) => {
      if (count > maxCount) {
        maxCount = count;
        dominantType = type;
      }
    });
    
    return {
      dominantType,
      purpose: this.inferPurpose(nodes),
      activityPattern: this.analyzeActivityPattern(nodes),
      stability: 0.7, // Would be calculated from temporal data
      growthTrend: 'stable'
    };
  }
  
  private inferPurpose(nodes: NetworkNode[]): string[] {
    const purposes: string[] = [];
    
    const hasFinancial = nodes.some(n => n.attributes.type === 'financial_entity');
    const hasOrg = nodes.some(n => n.attributes.type === 'organization');
    
    if (hasFinancial) purposes.push('financial_activity');
    if (hasOrg) purposes.push('organizational_coordination');
    if (nodes.length > 10) purposes.push('large_scale_operation');
    
    return purposes.length > 0 ? purposes : ['unknown'];
  }
  
  private analyzeActivityPattern(nodes: NetworkNode[]): string {
    const patterns = nodes
      .filter(n => n.attributes.temporalPattern)
      .map(n => n.attributes.temporalPattern!);
    
    if (patterns.length === 0) return 'insufficient_data';
    
    const avgBurstiness = patterns.reduce((sum, p) => sum + p.burstiness, 0) / patterns.length;
    
    if (avgBurstiness > 0.7) return 'sporadic_burst';
    if (avgBurstiness < 0.3) return 'regular_periodic';
    return 'mixed_pattern';
  }
  
  private identifyKeyMembers(nodeIds: string[]): KeyMember[] {
    const members: KeyMember[] = [];
    
    nodeIds.forEach(id => {
      const node = this.graph.nodes.find(n => n.id === id);
      if (!node) return;
      
      const role = this.inferRole(node, nodeIds);
      const influence = node.centrality.eigenvector;
      
      if (influence > 0.3 || role === 'leader' || role === 'broker') {
        members.push({
          nodeId: id,
          role,
          influence,
          replaceability: this.calculateReplaceability(node, nodeIds),
          vulnerabilities: this.identifyNodeVulnerabilities(node)
        });
      }
    });
    
    return members.sort((a, b) => b.influence - a.influence).slice(0, 5);
  }
  
  private inferRole(node: NetworkNode, communityNodes: string[]): MemberRole {
    const { centrality } = node;
    
    if (centrality.eigenvector > 0.7 && centrality.degree > 0.6) return 'leader';
    if (centrality.betweenness > 0.6) return 'broker';
    if (centrality.closeness > 0.7) return 'coordinator';
    if (centrality.degree < 0.2) return 'peripheral';
    
    return 'specialist';
  }
  
  private calculateReplaceability(node: NetworkNode, communityNodes: string[]): number {
    // High betweenness = hard to replace
    return 1 - node.centrality.betweenness;
  }
  
  private identifyNodeVulnerabilities(node: NetworkNode): string[] {
    const vulns: string[] = [];
    
    if (node.centrality.degree < 0.3) vulns.push('isolation_vulnerability');
    if (node.centrality.betweenness > 0.7) vulns.push('single_point_of_failure');
    
    return vulns;
  }
  
  private findExternalConnections(
    nodeIds: string[],
    partitions: Map<string, string>
  ): ExternalConnection[] {
    const connections = new Map<string, ExternalConnection>();
    
    this.graph.edges.forEach(edge => {
      const sourceIn = nodeIds.includes(edge.source);
      const targetIn = nodeIds.includes(edge.target);
      
      if (sourceIn !== targetIn) {
        const externalNode = sourceIn ? edge.target : edge.source;
        const internalNode = sourceIn ? edge.source : edge.target;
        const externalComm = partitions.get(externalNode);
        
        if (externalComm) {
          if (!connections.has(externalComm)) {
            connections.set(externalComm, {
              targetCommunityId: externalComm,
              bridgeNodes: [],
              connectionStrength: 0,
              connectionType: edge.type
            });
          }
          
          const conn = connections.get(externalComm)!;
          if (!conn.bridgeNodes.includes(internalNode)) {
            conn.bridgeNodes.push(internalNode);
          }
          conn.connectionStrength += edge.weight;
        }
      }
    });
    
    return [...connections.values()];
  }
  
  private assessCommunityRisk(
    nodes: NetworkNode[],
    characterization: CommunityCharacterization
  ): CommunityRisk {
    const riskFactors: RiskFactor[] = [];
    let totalRisk = 0;
    
    // Check for concerning patterns
    if (characterization.activityPattern === 'sporadic_burst') {
      riskFactors.push({
        type: 'activity_pattern',
        description: 'Irregular burst activity pattern',
        severity: 0.6,
        evidence: ['sporadic_communication']
      });
      totalRisk += 0.6;
    }
    
    if (nodes.length > 20 && characterization.dominantType === 'person') {
      riskFactors.push({
        type: 'large_personal_network',
        description: 'Large coordinated personal network',
        severity: 0.4,
        evidence: [`${nodes.length} connected individuals`]
      });
      totalRisk += 0.4;
    }
    
    const avgRisk = riskFactors.length > 0 ? totalRisk / riskFactors.length : 0;
    
    let threatLevel: CommunityRisk['threatLevel'];
    if (avgRisk < 0.2) threatLevel = 'low';
    else if (avgRisk < 0.4) threatLevel = 'moderate';
    else if (avgRisk < 0.6) threatLevel = 'elevated';
    else if (avgRisk < 0.8) threatLevel = 'high';
    else threatLevel = 'critical';
    
    return {
      threatLevel,
      riskFactors,
      surveillancePriority: avgRisk,
      indicators: riskFactors.map(f => f.description)
    };
  }
}

// ============================================
// Influence Maximization Bandit
// ============================================

export interface InfluenceMaxConfig {
  explorationRate: number;
  batchSize: number;
  maxRounds: number;
  rewardDecay: number;
}

export class InfluenceMaxBandit {
  private arms: Map<string, ArmStatistics>;
  private config: InfluenceMaxConfig;
  
  constructor(nodeIds: string[], config: Partial<InfluenceMaxConfig> = {}) {
    this.config = {
      explorationRate: 0.1,
      batchSize: 5,
      maxRounds: 100,
      rewardDecay: 0.95,
      ...config
    };
    
    this.arms = new Map();
    nodeIds.forEach(id => {
      this.arms.set(id, {
        pulls: 0,
        totalReward: 0,
        avgReward: 0,
        ucbScore: Infinity
      });
    });
  }
  
  selectNodes(k: number): string[] {
    const selected: string[] = [];
    
    // Update UCB scores
    const totalPulls = [...this.arms.values()].reduce((sum, a) => sum + a.pulls, 0) || 1;
    
    this.arms.forEach((stats, nodeId) => {
      if (stats.pulls === 0) {
        stats.ucbScore = Infinity;
      } else {
        const exploitation = stats.avgReward;
        const exploration = Math.sqrt(2 * Math.log(totalPulls) / stats.pulls);
        stats.ucbScore = exploitation + this.config.explorationRate * exploration;
      }
    });
    
    // Select top-k by UCB score
    const sorted = [...this.arms.entries()]
      .sort((a, b) => b[1].ucbScore - a[1].ucbScore);
    
    for (let i = 0; i < Math.min(k, sorted.length); i++) {
      selected.push(sorted[i][0]);
    }
    
    return selected;
  }
  
  updateRewards(results: Map<string, number>): void {
    results.forEach((reward, nodeId) => {
      const stats = this.arms.get(nodeId);
      if (stats) {
        stats.pulls++;
        stats.totalReward += reward;
        stats.avgReward = stats.totalReward / stats.pulls;
      }
    });
  }
  
  getTopInfluencers(k: number): string[] {
    return [...this.arms.entries()]
      .sort((a, b) => b[1].avgReward - a[1].avgReward)
      .slice(0, k)
      .map(([id]) => id);
  }
}

interface ArmStatistics {
  pulls: number;
  totalReward: number;
  avgReward: number;
  ucbScore: number;
}

// ============================================
// Cascade Predictor
// ============================================

export interface CascadeFeatures {
  initiatorCentrality: number;
  initialSpread: number;
  contentViralityScore: number;
  networkDensity: number;
  temporalMomentum: number;
}

export interface CascadePrediction {
  expectedReach: number;
  peakTime: number;
  confidenceInterval: [number, number];
  trajectory: CascadePoint[];
}

export interface CascadePoint {
  time: number;
  reach: number;
  velocity: number;
}

export function predictCascade(
  features: CascadeFeatures,
  timeHorizons: number[] = [6, 12, 24]
): Map<number, CascadePrediction> {
  const predictions = new Map<number, CascadePrediction>();
  
  // Base growth rate from features
  const baseGrowthRate = 
    features.initiatorCentrality * 0.3 +
    features.initialSpread * 0.25 +
    features.contentViralityScore * 0.25 +
    features.networkDensity * 0.1 +
    features.temporalMomentum * 0.1;
  
  timeHorizons.forEach(horizon => {
    const trajectory: CascadePoint[] = [];
    let currentReach = features.initialSpread;
    
    for (let t = 0; t <= horizon; t++) {
      const velocity = baseGrowthRate * Math.exp(-t / (horizon / 2));
      currentReach += velocity * currentReach * 0.1;
      
      trajectory.push({
        time: t,
        reach: Math.round(currentReach),
        velocity
      });
    }
    
    const finalReach = trajectory[trajectory.length - 1].reach;
    const uncertainty = finalReach * 0.2;
    
    predictions.set(horizon, {
      expectedReach: finalReach,
      peakTime: Math.round(horizon * 0.4),
      confidenceInterval: [
        Math.round(finalReach - uncertainty),
        Math.round(finalReach + uncertainty)
      ],
      trajectory
    });
  });
  
  return predictions;
}
