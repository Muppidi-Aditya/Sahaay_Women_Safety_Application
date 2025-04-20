import { Component } from "react";
import FeatureHeaderBlock from "../../components/FeatureHeaderBlock";
import './index.css'

class LicensePlateChecker extends Component {
    state = {
        plateNumber: '',
        loading: false,
        vehicleData: null,
        error: null
    };

    handleInputChange = (e) => {
        this.setState({ plateNumber: e.target.value });
    };

    checkLicensePlate = async () => {
        const { plateNumber } = this.state;
        
        if (!plateNumber) {
            this.setState({ error: 'Please enter a license plate number' });
            return;
        }

        this.setState({ loading: true, error: null, vehicleData: null });

        try {
            const url = 'https://vehicle-information-verification-rto-india.p.rapidapi.com/rc-full';
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-rapidapi-key': 'b18e830906msh07166028c8e1e7bp119e55jsn64857226e585',
                    // 'x-rapidapi-key': 'a6f62a07cemsh34a86bfb3030674p175e64jsnb052fec44f90',
		            'x-rapidapi-host': 'vehicle-information-verification-rto-india.p.rapidapi.com',
                },
                body: JSON.stringify({
                    id_number: plateNumber
                })
            };

            const response = await fetch(url, options);
            const data = await response.json();
            
            if (response.ok) {
                this.setState({ vehicleData: data });
            } else {
                this.setState({ error: data.message || 'Failed to fetch vehicle information' });
            }
        } catch (err) {
            this.setState({ error: 'An error occurred while checking the license plate' });
            console.error('Error:', err);
        } finally {
            this.setState({ loading: false });
        }
    };

    render() {
        const { plateNumber, loading, vehicleData, error } = this.state;
        return (
            <div className="license-plate-checker-main-bg">
                <FeatureHeaderBlock featureName='License Plate Checker' />
                
                <div className="license-plate-checker-container">
                    <div className="license-plate-input-section">
                        <input
                            type="text"
                            value={plateNumber}
                            onChange={this.handleInputChange}
                            placeholder="Enter license plate number (e.g., AP39JK5989)"
                            className="license-plate-input"
                        />
                        <button
                            onClick={this.checkLicensePlate}
                            disabled={loading}
                            className="check-button"
                        >
                            {loading ? 'Checking...' : 'Check'}
                        </button>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    {vehicleData && (
                        <div className="vehicle-details">
                            <h3>Vehicle Details</h3>
                            <pre>{JSON.stringify(vehicleData, null, 2)}</pre>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

export default LicensePlateChecker;