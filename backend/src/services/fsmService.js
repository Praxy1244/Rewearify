// Finite State Machine for Donation Lifecycle Management

class DonationFSM {
  constructor() {
    // Define all valid states
    this.states = {
      DRAFT: 'draft',
      PENDING: 'pending',
      APPROVED: 'approved',
      REJECTED: 'rejected',
      MATCHED: 'matched',
      PICKUP_SCHEDULED: 'pickup_scheduled',
      IN_TRANSIT: 'in_transit',
      DELIVERED: 'delivered',
      COMPLETED: 'completed',
      CANCELLED: 'cancelled',
      FLAGGED: 'flagged'
    };

    // Define valid state transitions
    this.transitions = {
      draft: ['pending', 'cancelled'],
      pending: ['approved', 'rejected', 'flagged', 'cancelled'],
      approved: ['matched', 'cancelled', 'flagged'],
      rejected: ['pending'], // Can resubmit
      matched: ['pickup_scheduled', 'cancelled'],
      pickup_scheduled: ['in_transit', 'cancelled'],
      in_transit: ['delivered', 'pickup_scheduled'], // Can return to pickup if failed
      delivered: ['completed'],
      completed: [], // Terminal state
      cancelled: [], // Terminal state
      flagged: ['pending', 'rejected'] // Admin can unflag or reject
    };

    // State descriptions
    this.stateDescriptions = {
      draft: 'Donation being created',
      pending: 'Awaiting admin review',
      approved: 'Approved by admin, awaiting match',
      rejected: 'Rejected by admin',
      matched: 'Matched with an NGO',
      pickup_scheduled: 'Pickup scheduled',
      in_transit: 'In transit to NGO',
      delivered: 'Delivered to NGO',
      completed: 'Donation completed',
      cancelled: 'Donation cancelled',
      flagged: 'Flagged for review (potential fraud)'
    };

    // Actions that can trigger transitions
    this.actions = {
      SUBMIT: 'submit',
      APPROVE: 'approve',
      REJECT: 'reject',
      MATCH: 'match',
      SCHEDULE_PICKUP: 'schedule_pickup',
      START_TRANSIT: 'start_transit',
      DELIVER: 'deliver',
      COMPLETE: 'complete',
      CANCEL: 'cancel',
      FLAG: 'flag',
      UNFLAG: 'unflag'
    };

    // Map actions to transitions
    this.actionTransitions = {
      submit: { from: 'draft', to: 'pending' },
      approve: { from: 'pending', to: 'approved' },
      reject: { from: 'pending', to: 'rejected' },
      match: { from: 'approved', to: 'matched' },
      schedule_pickup: { from: 'matched', to: 'pickup_scheduled' },
      start_transit: { from: 'pickup_scheduled', to: 'in_transit' },
      deliver: { from: 'in_transit', to: 'delivered' },
      complete: { from: 'delivered', to: 'completed' },
      cancel: { from: '*', to: 'cancelled' }, // Can cancel from any state
      flag: { from: '*', to: 'flagged' },
      unflag: { from: 'flagged', to: 'pending' }
    };
  }

  /**
   * Check if a state transition is valid
   */
  canTransition(fromState, toState) {
    if (!this.states[fromState.toUpperCase()]) {
      return { valid: false, error: `Invalid current state: ${fromState}` };
    }

    if (!this.states[toState.toUpperCase()]) {
      return { valid: false, error: `Invalid target state: ${toState}` };
    }

    const validTransitions = this.transitions[fromState.toLowerCase()];
    
    if (!validTransitions.includes(toState.toLowerCase())) {
      return {
        valid: false,
        error: `Cannot transition from ${fromState} to ${toState}. Valid transitions: ${validTransitions.join(', ')}`
      };
    }

    return { valid: true };
  }

  /**
   * Get valid next states from current state
   */
  getValidTransitions(currentState) {
    const state = currentState.toLowerCase();
    return this.transitions[state] || [];
  }

  /**
   * Get state description
   */
  getStateDescription(state) {
    return this.stateDescriptions[state.toLowerCase()] || 'Unknown state';
  }

  /**
   * Check if state is terminal (no further transitions)
   */
  isTerminalState(state) {
    return this.transitions[state.toLowerCase()]?.length === 0;
  }

  /**
   * Get action for transition
   */
  getActionForTransition(fromState, toState) {
    for (const [action, transition] of Object.entries(this.actionTransitions)) {
      if (
        (transition.from === '*' || transition.from === fromState.toLowerCase()) &&
        transition.to === toState.toLowerCase()
      ) {
        return action;
      }
    }
    return null;
  }

  /**
   * Validate and execute state transition
   */
  async transition(donation, toState, actor, metadata = {}) {
    const fromState = donation.status;
    
    // Check if transition is valid
    const validation = this.canTransition(fromState, toState);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Get action
    const action = this.getActionForTransition(fromState, toState);

    // Create state history entry
    const historyEntry = {
      from_state: fromState,
      to_state: toState,
      action: action || 'manual_transition',
      actor: {
        id: actor.id,
        name: actor.name,
        role: actor.role
      },
      timestamp: new Date(),
      metadata: metadata
    };

    // Add to donation's state history
    if (!donation.state_history) {
      donation.state_history = [];
    }
    donation.state_history.push(historyEntry);

    // Update donation status
    donation.status = toState;

    // Set timestamps
    if (toState === 'approved') {
      donation.approvedAt = new Date();
      donation.approvedBy = actor.id;
    } else if (toState === 'rejected') {
      donation.rejectedAt = new Date();
      donation.rejectedBy = actor.id;
    } else if (toState === 'matched') {
      donation.matchedAt = new Date();
    } else if (toState === 'completed') {
      donation.completedAt = new Date();
    }

    return {
      success: true,
      from: fromState,
      to: toState,
      action: action,
      history: historyEntry
    };
  }

  /**
   * Get donation lifecycle statistics
   */
  getLifecycleStats(stateHistory) {
    if (!stateHistory || stateHistory.length === 0) {
      return null;
    }

    const firstEntry = stateHistory[0];
    const lastEntry = stateHistory[stateHistory.length - 1];

    // Calculate time in each state
    const timeInStates = {};
    for (let i = 0; i < stateHistory.length; i++) {
      const entry = stateHistory[i];
      const nextEntry = stateHistory[i + 1];
      
      const startTime = new Date(entry.timestamp);
      const endTime = nextEntry ? new Date(nextEntry.timestamp) : new Date();
      const duration = (endTime - startTime) / (1000 * 60 * 60); // hours

      if (!timeInStates[entry.to_state]) {
        timeInStates[entry.to_state] = 0;
      }
      timeInStates[entry.to_state] += duration;
    }

    // Total lifecycle time
    const totalTime = (new Date() - new Date(firstEntry.timestamp)) / (1000 * 60 * 60);

    return {
      created_at: firstEntry.timestamp,
      current_state: lastEntry.to_state,
      total_transitions: stateHistory.length,
      total_time_hours: Math.round(totalTime * 10) / 10,
      time_in_states: timeInStates,
      longest_state: Object.entries(timeInStates).reduce((a, b) => 
        a[1] > b[1] ? a : b
      )[0]
    };
  }

  /**
   * Get state color for UI
   */
  getStateColor(state) {
    const colors = {
      draft: '#6B7280',
      pending: '#F59E0B',
      approved: '#10B981',
      rejected: '#EF4444',
      matched: '#3B82F6',
      pickup_scheduled: '#8B5CF6',
      in_transit: '#06B6D4',
      delivered: '#14B8A6',
      completed: '#22C55E',
      cancelled: '#9CA3AF',
      flagged: '#DC2626'
    };
    return colors[state.toLowerCase()] || '#6B7280';
  }
}

// Singleton instance
const donationFSM = new DonationFSM();

export default donationFSM;
