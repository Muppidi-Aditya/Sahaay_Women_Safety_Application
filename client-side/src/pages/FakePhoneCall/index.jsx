import { Component } from "react";
import './index.css'
import FeatureHeaderBlock from "../../components/FeatureHeaderBlock";
import Cookies from 'js-cookie'

class FakePhoneCall extends Component {
    state = {
        phnNumber: '',
        loading: false,
        callStatus: null,
        error: null
    }

    componentDidMount() {
        this.fetchUserData();
    }

    fetchUserData = async () => {
        try {
            const uid = Cookies.get('auth');
            
            if (!uid) {
                throw new Error('User not authenticated');
            }

            const response = await fetch(`http://localhost:5001/api/getdata?uid=${uid}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }

            const data = await response.json();
            
            if (data.success && data.user) {
                this.setState({
                    phnNumber: '+91' + data.user.phn_number,
                });
            } else {
                throw new Error(data.error || 'User data not found');
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            this.setState({ 
                error: error.message,
                loading: false 
            });
        }
    };

    makeFakeCall = async () => {
        try {
            this.setState({ loading: true, callStatus: 'calling', error: null });
            
            // Make API call to initiate fake phone call
            const response = await fetch('http://localhost:5001/api/make-call', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phoneNumber: this.state.phnNumber
                }),
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.setState({ 
                    callStatus: 'success',
                    callSid: data.callSid,
                    loading: false
                });
                
                // Reset status after 5 seconds
                setTimeout(() => {
                    this.setState({ callStatus: null });
                }, 5000);
            } else {
                throw new Error(data.error || 'Failed to initiate call');
            }
        } catch (error) {
            console.error('Error making fake call:', error);
            this.setState({ 
                error: error.message, 
                callStatus: 'failed',
                loading: false 
            });
            
            // Reset error after 5 seconds
            setTimeout(() => {
                this.setState({ error: null, callStatus: null });
            }, 5000);
        }
    }

    renderCallStatus() {
        const { callStatus, error } = this.state;
        
        if (callStatus === 'calling') {
            return <div className="call-status calling">Initiating call...</div>;
        } else if (callStatus === 'success') {
            return <div className="call-status success">Call initiated successfully!</div>;
        } else if (callStatus === 'failed') {
            return <div className="call-status failed">Call failed: {error}</div>;
        }
        
        return null;
    }

    render() {
        const { loading, phnNumber, error } = this.state;
        
        return (
            <div className="fake-phone-call-main-div">
                <FeatureHeaderBlock featureName="Fake Phone Call" />
                <div className="fk-main-block">
                    {error && !this.state.callStatus && (
                        <div className="error-message">{error}</div>
                    )}
                    
                    {phnNumber ? (
                        <div className="phone-info">
                            <p>A fake call will be made to your registered number:</p>
                            <p className="phone-number">{phnNumber}</p>
                        </div>
                    ) : (
                        <p className="no-phone-message">No phone number found in your profile.</p>
                    )}
                    
                    {this.renderCallStatus()}
                    
                    <button 
                        className="fake-phn-call-btn" 
                        onClick={this.makeFakeCall}
                        disabled={loading || !phnNumber}
                    >
                        {loading ? 'Calling...' : 'Make Fake Phone Call'}
                    </button>
                </div>
            </div>
        );
    }
}

export default FakePhoneCall