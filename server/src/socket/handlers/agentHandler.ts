import { Server as SocketIOServer } from 'socket.io';
import {
  SOCKET_EVENTS,
  AuthenticatedSocket,
  AgentDashboardConnectPayload,
  AgentStatusUpdatePayload,
  AgentStatusBroadcastPayload,
  AgentDisconnectPayload,
  AgentHeartbeatPayload,
  AgentWorkloadUpdatePayload,
  AgentCapacityUpdatePayload,
  validatePayload,
} from '../events';
import User from '../../shared/models/User.model';
import AgentSession from '../../shared/models/AgentSession.model';

/**
 * Agent Socket Event Handlers
 * Handles real-time agent dashboard connections and status management
 * Implements Requirements 5.5, 12.1 (Task 9)
 */

// Agent room management
const AGENT_ROOMS = {
  ALL_AGENTS: 'agents:all',
  AVAILABLE: 'agents:available',
  BUSY: 'agents:busy',
  AWAY: 'agents:away',
  OFFLINE: 'agents:offline',
  SUPERVISORS: 'agents:supervisors',
} as const;

// Grace period for agent disconnections (30 seconds)
const DISCONNECT_GRACE_PERIOD = 30000;

// Heartbeat interval (60 seconds)
const HEARTBEAT_INTERVAL = 60000;

// Store agent heartbeat timers
const agentHeartbeats = new Map<string, NodeJS.Timeout>();

export function registerAgentHandlers(io: SocketIOServer, socket: AuthenticatedSocket) {
  /**
   * Handle agent:dashboardConnect event
   * Agent connects to dashboard interface
   * Requirement 5.5, 12.1
   */
  socket.on(SOCKET_EVENTS.AGENT_DASHBOARD_CONNECT, async (data: AgentDashboardConnectPayload) => {
    try {
      if (!validatePayload<AgentDashboardConnectPayload>(data, ['agentId'])) {
        socket.emit('error', {
          errorCode: 'INVALID_PAYLOAD',
          errorMessage: 'Invalid agent dashboard connect payload',
        });
        return;
      }

      const { agentId, department, skills = [], maxConcurrentChats = 5 } = data;

      // Verify agent exists and has agent role
      const agent = await User.findById(agentId);
      if (!agent || agent.role !== 'agent') {
        socket.emit('error', {
          errorCode: 'UNAUTHORIZED',
          errorMessage: 'Invalid agent or insufficient permissions',
        });
        return;
      }

      // Set agent properties on socket
      socket.agentId = agentId;
      socket.role = 'agent';
      socket.department = department || (agent as any).agentProfile?.department;
      socket.skills = skills.length > 0 ? skills : (agent as any).agentProfile?.skills || [];
      socket.maxConcurrentChats = maxConcurrentChats;
      socket.currentChats = 0;
      socket.agentStatus = 'available';
      socket.lastHeartbeat = new Date();

      // Join agent rooms
      socket.join(AGENT_ROOMS.ALL_AGENTS);
      socket.join(AGENT_ROOMS.AVAILABLE);
      socket.join(`agent:${agentId}`);
      
      if (socket.department) {
        socket.join(`agents:department:${socket.department}`);
      }

      // Create or update agent session
      let agentSession = await AgentSession.findOne({
        agentId,
        status: 'active',
      });

      if (!agentSession) {
        agentSession = await AgentSession.create({
          agentId,
          sessionStart: new Date(),
          status: 'active',
        });
      }

      // Update agent status in database
      const updateResult = await User.findByIdAndUpdate(agentId, {
        $set: {
          agentStatus: 'available',
          lastLoginAt: new Date(),
          'agentProfile.department': socket.department,
          'agentProfile.skills': socket.skills,
          'agentProfile.maxConcurrentChats': socket.maxConcurrentChats,
        }
      }, { new: true });

      console.log(`📝 Agent profile updated: department=${socket.department}, skills=${socket.skills?.join(',')}`);
      console.log(`📝 Update result: ${updateResult ? 'Success' : 'Failed'}`);

      // Start heartbeat monitoring
      startHeartbeatMonitoring(socket, agentId);

      // Broadcast agent availability to other agents and supervisors
      const statusBroadcast: AgentStatusBroadcastPayload = {
        agentId,
        agentName: `${agent.firstName} ${agent.lastName}`,
        status: 'available',
        department: socket.department,
        timestamp: new Date(),
      };

      io.to(AGENT_ROOMS.ALL_AGENTS).emit(SOCKET_EVENTS.AGENT_STATUS_BROADCAST, statusBroadcast);
      io.to(AGENT_ROOMS.SUPERVISORS).emit(SOCKET_EVENTS.AGENT_STATUS_BROADCAST, statusBroadcast);

      // Send connection confirmation
      socket.emit('agent:connected', {
        agentId,
        status: 'available',
        department: socket.department,
        skills: socket.skills,
        maxConcurrentChats: socket.maxConcurrentChats,
        sessionId: agentSession._id,
      });

      console.log(`🎯 Agent dashboard connected: ${agentId} (${agent.email})`);
      console.log(`   Department: ${socket.department || 'None'}`);
      console.log(`   Skills: ${socket.skills?.join(', ') || 'None'}`);
      console.log(`   Max Chats: ${socket.maxConcurrentChats}`);

    } catch (error: any) {
      console.error('Agent dashboard connect error:', error);
      socket.emit('error', {
        errorCode: 'CONNECT_ERROR',
        errorMessage: 'Failed to connect to agent dashboard',
      });
    }
  });

  /**
   * Handle agent:statusUpdate event
   * Agent updates their availability status
   * Requirement 4.1, 4.2
   */
  socket.on(SOCKET_EVENTS.AGENT_STATUS_UPDATE, async (data: AgentStatusUpdatePayload) => {
    try {
      if (!validatePayload<AgentStatusUpdatePayload>(data, ['agentId', 'status'])) {
        socket.emit('error', {
          errorCode: 'INVALID_PAYLOAD',
          errorMessage: 'Invalid status update payload',
        });
        return;
      }

      const { agentId, status, reason } = data;

      // Verify agent owns this socket
      if (socket.agentId !== agentId) {
        socket.emit('error', {
          errorCode: 'UNAUTHORIZED',
          errorMessage: 'Cannot update status for different agent',
        });
        return;
      }

      const previousStatus = socket.agentStatus;
      socket.agentStatus = status;

      // Update room membership based on status
      if (previousStatus) {
        socket.leave(`agents:${previousStatus}`);
      }
      socket.join(`agents:${status}`);

      // Update database
      await User.findByIdAndUpdate(agentId, {
        agentStatus: status,
        lastLoginAt: new Date(),
      });

      // Update agent session
      if (status === 'offline') {
        await AgentSession.findOneAndUpdate(
          { agentId, status: 'active' },
          { 
            status: 'ended',
            sessionEnd: new Date(),
          }
        );
      }

      // Get agent info for broadcast
      const agent = await User.findById(agentId);
      
      // Broadcast status change
      const statusBroadcast: AgentStatusBroadcastPayload = {
        agentId,
        agentName: agent ? `${agent.firstName} ${agent.lastName}` : 'Unknown Agent',
        status,
        department: socket.department,
        timestamp: new Date(),
      };

      io.to(AGENT_ROOMS.ALL_AGENTS).emit(SOCKET_EVENTS.AGENT_STATUS_BROADCAST, statusBroadcast);
      io.to(AGENT_ROOMS.SUPERVISORS).emit(SOCKET_EVENTS.AGENT_STATUS_BROADCAST, statusBroadcast);

      // Confirm status update
      socket.emit('agent:statusUpdated', {
        agentId,
        status,
        previousStatus,
        reason,
        timestamp: new Date(),
      });

      console.log(`📊 Agent status updated: ${agentId} ${previousStatus} → ${status}`);
      if (reason) {
        console.log(`   Reason: ${reason}`);
      }

    } catch (error: any) {
      console.error('Agent status update error:', error);
      socket.emit('error', {
        errorCode: 'STATUS_UPDATE_ERROR',
        errorMessage: 'Failed to update agent status',
      });
    }
  });

  /**
   * Handle agent:workloadUpdate event
   * Update agent's current workload
   * Requirement 4.3, 4.5
   */
  socket.on(SOCKET_EVENTS.AGENT_WORKLOAD_UPDATE, async (data: AgentWorkloadUpdatePayload) => {
    try {
      if (!validatePayload<AgentWorkloadUpdatePayload>(data, ['agentId', 'activeChats', 'maxChats'])) {
        socket.emit('error', {
          errorCode: 'INVALID_PAYLOAD',
          errorMessage: 'Invalid workload update payload',
        });
        return;
      }

      const { agentId, activeChats, maxChats, queuedTickets = 0 } = data;

      // Verify agent owns this socket
      if (socket.agentId !== agentId) {
        socket.emit('error', {
          errorCode: 'UNAUTHORIZED',
          errorMessage: 'Cannot update workload for different agent',
        });
        return;
      }

      socket.currentChats = activeChats;
      socket.maxConcurrentChats = maxChats;

      // Determine capacity status
      let capacityStatus: 'full' | 'available' | 'limited';
      const availableSlots = maxChats - activeChats;

      if (availableSlots === 0) {
        capacityStatus = 'full';
      } else if (availableSlots <= 1) {
        capacityStatus = 'limited';
      } else {
        capacityStatus = 'available';
      }

      // Update agent session metrics
      await AgentSession.findOneAndUpdate(
        { agentId, status: 'active' },
        {
          totalChatsHandled: activeChats,
          peakConcurrentChats: Math.max(activeChats, socket.currentChats || 0),
        }
      );

      // Broadcast capacity update to supervisors
      const capacityUpdate: AgentCapacityUpdatePayload = {
        agentId,
        capacity: capacityStatus,
        availableSlots,
        maxSlots: maxChats,
      };

      io.to(AGENT_ROOMS.SUPERVISORS).emit(SOCKET_EVENTS.AGENT_CAPACITY_UPDATE, capacityUpdate);

      // Confirm workload update
      socket.emit('agent:workloadUpdated', {
        agentId,
        activeChats,
        maxChats,
        availableSlots,
        capacity: capacityStatus,
        queuedTickets,
      });

      console.log(`💼 Agent workload updated: ${agentId} - ${activeChats}/${maxChats} chats (${capacityStatus})`);

    } catch (error: any) {
      console.error('Agent workload update error:', error);
      socket.emit('error', {
        errorCode: 'WORKLOAD_UPDATE_ERROR',
        errorMessage: 'Failed to update agent workload',
      });
    }
  });

  /**
   * Handle agent:heartbeat event
   * Keep-alive for connection monitoring
   * Requirement 5.5
   */
  socket.on(SOCKET_EVENTS.AGENT_HEARTBEAT, async (data: AgentHeartbeatPayload) => {
    try {
      if (!validatePayload<AgentHeartbeatPayload>(data, ['agentId', 'timestamp'])) {
        return; // Silently ignore invalid heartbeats
      }

      const { agentId, activeChats } = data;

      if (socket.agentId === agentId) {
        socket.lastHeartbeat = new Date();
        
        if (activeChats !== undefined) {
          socket.currentChats = activeChats;
        }

        // Reset heartbeat timer
        resetHeartbeatTimer(agentId);

        // Update last seen in database
        await User.findByIdAndUpdate(agentId, {
          lastLoginAt: new Date(),
        });
      }

    } catch (error: any) {
      console.error('Agent heartbeat error:', error);
    }
  });

  /**
   * Handle agent:disconnect event
   * Agent disconnects with grace period
   * Requirement 5.5
   */
  socket.on(SOCKET_EVENTS.AGENT_DISCONNECT, async (data: AgentDisconnectPayload) => {
    try {
      const { agentId, gracePeriod = DISCONNECT_GRACE_PERIOD, reason } = data;

      if (socket.agentId === agentId) {
        await handleAgentDisconnect(io, socket, gracePeriod, reason || 'Manual disconnect');
      }

    } catch (error: any) {
      console.error('Agent disconnect error:', error);
    }
  });

  /**
   * Handle socket disconnect event
   * Automatic cleanup on connection loss
   * Requirement 5.5
   */
  socket.on(SOCKET_EVENTS.DISCONNECT, async (reason: string) => {
    try {
      if (socket.agentId) {
        console.log(`🔌 Agent socket disconnected: ${socket.agentId} - Reason: ${reason}`);
        await handleAgentDisconnect(io, socket, DISCONNECT_GRACE_PERIOD, `Socket disconnect: ${reason}`);
      }

    } catch (error: any) {
      console.error('Agent socket disconnect error:', error);
    }
  });
}

/**
 * Start heartbeat monitoring for an agent
 */
function startHeartbeatMonitoring(socket: AuthenticatedSocket, agentId: string): void {
  // Clear existing timer if any
  const existingTimer = agentHeartbeats.get(agentId);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  // Set new heartbeat timer
  const timer = setTimeout(() => {
    console.warn(`⚠️  Agent heartbeat timeout: ${agentId}`);
    socket.emit('agent:heartbeatTimeout', {
      agentId,
      timeout: HEARTBEAT_INTERVAL,
    });
  }, HEARTBEAT_INTERVAL);

  agentHeartbeats.set(agentId, timer);
}

/**
 * Reset heartbeat timer for an agent
 */
function resetHeartbeatTimer(agentId: string): void {
  const existingTimer = agentHeartbeats.get(agentId);
  if (existingTimer) {
    clearTimeout(existingTimer);
    
    // Set new timer
    const timer = setTimeout(() => {
      console.warn(`⚠️  Agent heartbeat timeout: ${agentId}`);
    }, HEARTBEAT_INTERVAL);

    agentHeartbeats.set(agentId, timer);
  }
}

/**
 * Handle agent disconnect with grace period
 */
async function handleAgentDisconnect(
  io: SocketIOServer,
  socket: AuthenticatedSocket,
  gracePeriod: number,
  reason: string
): Promise<void> {
  const agentId = socket.agentId;
  if (!agentId) return;

  console.log(`👋 Agent disconnecting: ${agentId} - Grace period: ${gracePeriod}ms`);
  console.log(`   Reason: ${reason}`);

  // Clear heartbeat timer
  const heartbeatTimer = agentHeartbeats.get(agentId);
  if (heartbeatTimer) {
    clearTimeout(heartbeatTimer);
    agentHeartbeats.delete(agentId);
  }

  // Set grace period timer
  setTimeout(async () => {
    try {
      // Check if agent reconnected during grace period
      const reconnectedSocket = getAgentSocket(io, agentId);
      if (reconnectedSocket && reconnectedSocket.id !== socket.id) {
        console.log(`✅ Agent reconnected during grace period: ${agentId}`);
        return;
      }

      // Agent didn't reconnect, mark as offline
      await User.findByIdAndUpdate(agentId, {
        agentStatus: 'offline',
        lastLoginAt: new Date(),
      });

      // End agent session
      await AgentSession.findOneAndUpdate(
        { agentId, status: 'active' },
        {
          status: 'ended',
          sessionEnd: new Date(),
        }
      );

      // Broadcast offline status
      const statusBroadcast: AgentStatusBroadcastPayload = {
        agentId,
        status: 'offline',
        department: socket.department,
        timestamp: new Date(),
      };

      io.to(AGENT_ROOMS.ALL_AGENTS).emit(SOCKET_EVENTS.AGENT_STATUS_BROADCAST, statusBroadcast);
      io.to(AGENT_ROOMS.SUPERVISORS).emit(SOCKET_EVENTS.AGENT_STATUS_BROADCAST, statusBroadcast);

      console.log(`❌ Agent marked offline after grace period: ${agentId}`);

    } catch (error: any) {
      console.error('Grace period cleanup error:', error);
    }
  }, gracePeriod);

  // Leave agent rooms
  socket.leave(AGENT_ROOMS.ALL_AGENTS);
  socket.leave(AGENT_ROOMS.AVAILABLE);
  socket.leave(AGENT_ROOMS.BUSY);
  socket.leave(AGENT_ROOMS.AWAY);
  socket.leave(`agent:${agentId}`);
  
  if (socket.department) {
    socket.leave(`agents:department:${socket.department}`);
  }
}

/**
 * Get agent socket by agent ID
 */
function getAgentSocket(io: SocketIOServer, agentId: string): AuthenticatedSocket | null {
  const sockets = Array.from(io.sockets.sockets.values());
  for (const socket of sockets) {
    const authSocket = socket as AuthenticatedSocket;
    if (authSocket.agentId === agentId) {
      return authSocket;
    }
  }
  return null;
}

/**
 * Helper functions for agent room management
 */
export const AgentRoomHelpers = {
  ROOMS: AGENT_ROOMS,
  
  /**
   * Emit event to all agents
   */
  emitToAllAgents(io: SocketIOServer, event: string, data: any): void {
    io.to(AGENT_ROOMS.ALL_AGENTS).emit(event, data);
  },

  /**
   * Emit event to available agents
   */
  emitToAvailableAgents(io: SocketIOServer, event: string, data: any): void {
    io.to(AGENT_ROOMS.AVAILABLE).emit(event, data);
  },

  /**
   * Emit event to agents in specific department
   */
  emitToDepartment(io: SocketIOServer, department: string, event: string, data: any): void {
    io.to(`agents:department:${department}`).emit(event, data);
  },

  /**
   * Emit event to supervisors
   */
  emitToSupervisors(io: SocketIOServer, event: string, data: any): void {
    io.to(AGENT_ROOMS.SUPERVISORS).emit(event, data);
  },

  /**
   * Get connected agents count by status
   */
  getAgentCounts(io: SocketIOServer): { available: number; busy: number; away: number; total: number } {
    const available = io.sockets.adapter.rooms.get(AGENT_ROOMS.AVAILABLE)?.size || 0;
    const busy = io.sockets.adapter.rooms.get(AGENT_ROOMS.BUSY)?.size || 0;
    const away = io.sockets.adapter.rooms.get(AGENT_ROOMS.AWAY)?.size || 0;
    const total = io.sockets.adapter.rooms.get(AGENT_ROOMS.ALL_AGENTS)?.size || 0;

    return { available, busy, away, total };
  },
};