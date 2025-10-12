"""
Finite State Machine (FSM) for SCDP donation lifecycle management
Tracks donation states and provides process analytics
"""

from transitions import Machine
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json

class DonationFSM:
    """Finite State Machine for donation lifecycle"""
    
    # Define states
    states = [
        'submitted',
        'under_review', 
        'approved',
        'rejected',
        'matched',
        'picked_up',
        'delivered',
        'completed'
    ]
    
    # Define transitions
    transitions = [
        # From submitted
        {'trigger': 'start_review', 'source': 'submitted', 'dest': 'under_review'},
        
        # From under_review
        {'trigger': 'approve', 'source': 'under_review', 'dest': 'approved'},
        {'trigger': 'reject', 'source': 'under_review', 'dest': 'rejected'},
        
        # From approved
        {'trigger': 'match_ngo', 'source': 'approved', 'dest': 'matched'},
        
        # From matched
        {'trigger': 'pickup', 'source': 'matched', 'dest': 'picked_up'},
        
        # From picked_up
        {'trigger': 'deliver', 'source': 'picked_up', 'dest': 'delivered'},
        
        # From delivered
        {'trigger': 'complete', 'source': 'delivered', 'dest': 'completed'},
        
        # Error recovery transitions
        {'trigger': 'resubmit', 'source': 'rejected', 'dest': 'submitted'},
        {'trigger': 'rematch', 'source': 'picked_up', 'dest': 'approved'},  # If pickup fails
    ]
    
    def __init__(self, donation_id, initial_state='submitted'):
        self.donation_id = donation_id
        self.state_history = []
        self.timestamps = {}
        self.metadata = {}
        
        # Initialize the state machine
        self.machine = Machine(
            model=self,
            states=DonationFSM.states,
            transitions=DonationFSM.transitions,
            initial=initial_state
        )
        
        # Record initial state
        self._record_state_change(initial_state, 'system', 'Initial state')
    
    def _record_state_change(self, new_state, actor, reason=''):
        """Record state change with timestamp"""
        timestamp = datetime.now()
        
        self.state_history.append({
            'state': new_state,
            'timestamp': timestamp,
            'actor': actor,
            'reason': reason
        })
        
        self.timestamps[new_state] = timestamp
    
    # Transition callbacks to record state changes
    def on_enter_under_review(self, actor='system', reason='Automatic review started'):
        self._record_state_change('under_review', actor, reason)
    
    def on_enter_approved(self, actor='admin', reason='Donation approved'):
        self._record_state_change('approved', actor, reason)
    
    def on_enter_rejected(self, actor='admin', reason='Donation rejected'):
        self._record_state_change('rejected', actor, reason)
    
    def on_enter_matched(self, actor='system', ngo_id=None, reason='NGO matched'):
        self.metadata['matched_ngo_id'] = ngo_id
        self._record_state_change('matched', actor, f"{reason} - NGO: {ngo_id}")
    
    def on_enter_picked_up(self, actor='ngo', reason='Items picked up'):
        self._record_state_change('picked_up', actor, reason)
    
    def on_enter_delivered(self, actor='ngo', feedback=None, rating=None, reason='Items delivered'):
        if feedback:
            self.metadata['delivery_feedback'] = feedback
        if rating:
            self.metadata['delivery_rating'] = rating
        self._record_state_change('delivered', actor, reason)
    
    def on_enter_completed(self, actor='system', reason='Donation lifecycle completed'):
        self._record_state_change('completed', actor, reason)
    
    def get_current_state(self):
        """Get current state of the donation"""
        return self.state
    
    def get_state_duration(self, state):
        """Get how long the donation spent in a specific state"""
        if state not in self.timestamps:
            return None
        
        # Find the next state after this one
        state_index = None
        for i, history_entry in enumerate(self.state_history):
            if history_entry['state'] == state:
                state_index = i
                break
        
        if state_index is None or state_index == len(self.state_history) - 1:
            # Current state or not found
            return (datetime.now() - self.timestamps[state]).total_seconds() / 3600  # hours
        
        next_timestamp = self.state_history[state_index + 1]['timestamp']
        return (next_timestamp - self.timestamps[state]).total_seconds() / 3600  # hours
    
    def get_total_processing_time(self):
        """Get total time from submission to current state"""
        if 'submitted' not in self.timestamps:
            return 0
        
        current_time = datetime.now()
        if len(self.state_history) > 0:
            current_time = self.state_history[-1]['timestamp']
        
        return (current_time - self.timestamps['submitted']).total_seconds() / 3600  # hours
    
    def is_stuck(self, threshold_hours=48):
        """Check if donation is stuck in current state"""
        if len(self.state_history) == 0:
            return False
        
        last_change = self.state_history[-1]['timestamp']
        time_since_change = (datetime.now() - last_change).total_seconds() / 3600
        
        return time_since_change > threshold_hours
    
    def get_bottlenecks(self):
        """Identify bottleneck states (states that took too long)"""
        bottlenecks = []
        
        for state in self.states:
            duration = self.get_state_duration(state)
            if duration is not None:
                # Define thresholds for each state
                thresholds = {
                    'submitted': 2,      # 2 hours
                    'under_review': 24,  # 24 hours
                    'approved': 12,      # 12 hours
                    'matched': 48,       # 48 hours
                    'picked_up': 168,    # 1 week
                    'delivered': 24,     # 24 hours
                }
                
                threshold = thresholds.get(state, 48)  # Default 48 hours
                
                if duration > threshold:
                    bottlenecks.append({
                        'state': state,
                        'duration_hours': duration,
                        'threshold_hours': threshold,
                        'severity': 'high' if duration > threshold * 2 else 'medium'
                    })
        
        return bottlenecks
    
    def to_dict(self):
        """Convert FSM state to dictionary for serialization"""
        return {
            'donation_id': self.donation_id,
            'current_state': self.state,
            'state_history': [
                {
                    'state': entry['state'],
                    'timestamp': entry['timestamp'].isoformat(),
                    'actor': entry['actor'],
                    'reason': entry['reason']
                }
                for entry in self.state_history
            ],
            'metadata': self.metadata,
            'total_processing_time_hours': self.get_total_processing_time(),
            'bottlenecks': self.get_bottlenecks(),
            'is_stuck': self.is_stuck()
        }

class FSMAnalyzer:
    """Analyzer for FSM data and process optimization"""
    
    def __init__(self):
        self.fsm_instances = {}
    
    def create_fsm_from_logs(self, logs_df):
        """Create FSM instances from donation logs"""
        for donation_id in logs_df['DonationID'].unique():
            donation_logs = logs_df[logs_df['DonationID'] == donation_id].sort_values('Timestamp')
            
            if len(donation_logs) == 0:
                continue
            
            # Create FSM instance
            first_log = donation_logs.iloc[0]
            fsm = DonationFSM(donation_id, initial_state=first_log['State'])
            
            # Process all state transitions
            for i, log_entry in donation_logs.iterrows():
                state = log_entry['State']
                actor = log_entry['Actor']
                timestamp = pd.to_datetime(log_entry['Timestamp'])
                
                # Manually set the state and record the transition
                if state != fsm.state:
                    # This is a simplified approach - in practice you'd trigger proper transitions
                    fsm.state = state
                    fsm._record_state_change(state, actor, f"Log entry: {log_entry.get('Feedback', '')}")
                    
                    # Update timestamp to match log
                    fsm.timestamps[state] = timestamp
                    fsm.state_history[-1]['timestamp'] = timestamp
            
            self.fsm_instances[donation_id] = fsm
        
        return self
    
    def get_process_analytics(self):
        """Generate process analytics across all FSM instances"""
        if not self.fsm_instances:
            return {}
        
        analytics = {
            'total_donations': len(self.fsm_instances),
            'state_distribution': {},
            'avg_processing_times': {},
            'bottleneck_analysis': {},
            'completion_rate': 0,
            'stuck_donations': 0
        }
        
        # State distribution
        for fsm in self.fsm_instances.values():
            state = fsm.get_current_state()
            analytics['state_distribution'][state] = analytics['state_distribution'].get(state, 0) + 1
        
        # Average processing times by state
        state_durations = {state: [] for state in DonationFSM.states}
        
        for fsm in self.fsm_instances.values():
            for state in DonationFSM.states:
                duration = fsm.get_state_duration(state)
                if duration is not None:
                    state_durations[state].append(duration)
        
        for state, durations in state_durations.items():
            if durations:
                analytics['avg_processing_times'][state] = {
                    'mean_hours': np.mean(durations),
                    'median_hours': np.median(durations),
                    'std_hours': np.std(durations),
                    'count': len(durations)
                }
        
        # Bottleneck analysis
        all_bottlenecks = []
        stuck_count = 0
        
        for fsm in self.fsm_instances.values():
            bottlenecks = fsm.get_bottlenecks()
            all_bottlenecks.extend(bottlenecks)
            
            if fsm.is_stuck():
                stuck_count += 1
        
        # Group bottlenecks by state
        bottleneck_counts = {}
        for bottleneck in all_bottlenecks:
            state = bottleneck['state']
            bottleneck_counts[state] = bottleneck_counts.get(state, 0) + 1
        
        analytics['bottleneck_analysis'] = bottleneck_counts
        analytics['stuck_donations'] = stuck_count
        
        # Completion rate
        completed_count = analytics['state_distribution'].get('completed', 0)
        analytics['completion_rate'] = completed_count / len(self.fsm_instances) * 100
        
        return analytics
    
    def get_state_transition_matrix(self):
        """Generate state transition probability matrix"""
        transitions = {}
        
        for fsm in self.fsm_instances.values():
            history = fsm.state_history
            
            for i in range(len(history) - 1):
                from_state = history[i]['state']
                to_state = history[i + 1]['state']
                
                if from_state not in transitions:
                    transitions[from_state] = {}
                
                transitions[from_state][to_state] = transitions[from_state].get(to_state, 0) + 1
        
        # Convert counts to probabilities
        transition_matrix = {}
        for from_state, to_states in transitions.items():
            total_transitions = sum(to_states.values())
            transition_matrix[from_state] = {
                to_state: count / total_transitions
                for to_state, count in to_states.items()
            }
        
        return transition_matrix
    
    def identify_process_improvements(self):
        """Identify potential process improvements"""
        analytics = self.get_process_analytics()
        improvements = []
        
        # Check for slow states
        for state, times in analytics['avg_processing_times'].items():
            if times['mean_hours'] > 48:  # More than 2 days
                improvements.append({
                    'type': 'slow_state',
                    'state': state,
                    'issue': f"Average time in {state} is {times['mean_hours']:.1f} hours",
                    'recommendation': f"Review and optimize {state} process"
                })
        
        # Check for bottlenecks
        for state, count in analytics['bottleneck_analysis'].items():
            if count > len(self.fsm_instances) * 0.1:  # More than 10% of donations
                improvements.append({
                    'type': 'bottleneck',
                    'state': state,
                    'issue': f"{count} donations experienced bottlenecks in {state}",
                    'recommendation': f"Investigate and resolve {state} bottlenecks"
                })
        
        # Check completion rate
        if analytics['completion_rate'] < 70:
            improvements.append({
                'type': 'low_completion',
                'issue': f"Only {analytics['completion_rate']:.1f}% of donations are completed",
                'recommendation': "Review end-to-end process for completion barriers"
            })
        
        # Check stuck donations
        if analytics['stuck_donations'] > 0:
            improvements.append({
                'type': 'stuck_donations',
                'issue': f"{analytics['stuck_donations']} donations are currently stuck",
                'recommendation': "Implement automated alerts for stuck donations"
            })
        
        return improvements
    
    def export_fsm_data(self):
        """Export all FSM data for external analysis"""
        export_data = []
        
        for donation_id, fsm in self.fsm_instances.items():
            export_data.append(fsm.to_dict())
        
        return export_data
    
    def get_performance_metrics(self):
        """Calculate key performance metrics"""
        if not self.fsm_instances:
            return {}
        
        metrics = {}
        
        # Average cycle time (submitted to delivered)
        cycle_times = []
        for fsm in self.fsm_instances.values():
            if 'submitted' in fsm.timestamps and 'delivered' in fsm.timestamps:
                cycle_time = (fsm.timestamps['delivered'] - fsm.timestamps['submitted']).total_seconds() / 3600
                cycle_times.append(cycle_time)
        
        if cycle_times:
            metrics['avg_cycle_time_hours'] = np.mean(cycle_times)
            metrics['median_cycle_time_hours'] = np.median(cycle_times)
        
        # Throughput (donations per day)
        if self.fsm_instances:
            all_timestamps = []
            for fsm in self.fsm_instances.values():
                if 'submitted' in fsm.timestamps:
                    all_timestamps.append(fsm.timestamps['submitted'])
            
            if len(all_timestamps) >= 2:
                time_span = (max(all_timestamps) - min(all_timestamps)).days
                metrics['throughput_per_day'] = len(self.fsm_instances) / max(time_span, 1)
        
        # Admin workload (manual interventions)
        manual_interventions = 0
        for fsm in self.fsm_instances.values():
            for entry in fsm.state_history:
                if entry['actor'] in ['admin', 'manual']:
                    manual_interventions += 1
        
        metrics['manual_interventions_per_donation'] = manual_interventions / len(self.fsm_instances)
        
        return metrics