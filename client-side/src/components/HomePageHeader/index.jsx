import React, { Component } from 'react';
import './index.css';
import WebsiteLogo from '../../assets/website_logo.png';
import { IoMenu } from "react-icons/io5";
import { RxCross2 } from "react-icons/rx";
import { MdOutlineDelete } from "react-icons/md";
import { FaPlus } from "react-icons/fa";
import Cookies from 'js-cookie';

class HomePageHeader extends Component {
    state = {
        menu: false,
        phnNumbersList: [],
        newPhoneNumber: '',
        loading: false,
        error: null
    };

    componentDidMount() {
        this.fetchPhoneNumbers();
    }

    fetchPhoneNumbers = async () => {
        try {
            const uid = Cookies.get('auth');
            if (!uid) return;
            
            this.setState({ loading: true });
            const response = await fetch(`http://localhost:5001/api/get-phones/${uid}`);
            const data = await response.json();
            
            if (data.success) {
                this.setState({ phnNumbersList: data.phoneNumbers });
            } else {
                throw new Error(data.error || 'Failed to fetch phone numbers');
            }
        } catch (error) {
            console.error('Fetch error:', error);
            this.setState({ error: error.message });
        } finally {
            this.setState({ loading: false });
        }
    };

    addPhoneNumber = async () => {
        try {
            const { newPhoneNumber } = this.state;
            const uid = Cookies.get('auth');
            
            if (!newPhoneNumber || !/^\d{10}$/.test(newPhoneNumber)) {
                throw new Error('Please enter a valid 10-digit phone number');
            }

            this.setState({ loading: true });
            const response = await fetch('http://localhost:5001/api/add-phone', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    uid,
                    phn_number: newPhoneNumber
                })
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to add phone number');
            }
            
            this.setState(prev => ({
                phnNumbersList: [...prev.phnNumbersList, newPhoneNumber],
                newPhoneNumber: ''
            }));
            
        } catch (error) {
            console.error('Add error:', error);
            this.setState({ error: error.message });
        } finally {
            this.setState({ loading: false });
        }
    };

    deletePhoneNumber = async (phoneNumber) => {
        try {
            const uid = Cookies.get('uid');
            if (!uid) return;
            
            this.setState({ loading: true });
            const response = await fetch('http://localhost:5001/api/delete-phone', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    uid,
                    phn_number: phoneNumber
                })
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to delete phone number');
            }
            
            this.setState(prev => ({
                phnNumbersList: prev.phnNumbersList.filter(num => num !== phoneNumber)
            }));
            
        } catch (error) {
            console.error('Delete error:', error);
            this.setState({ error: error.message });
        } finally {
            this.setState({ loading: false });
        }
    };

    onToggleMenuBtn = () => {
        this.setState(prevState => ({
            menu: !prevState.menu
        }));
    };

    handleInputChange = (e) => {
        this.setState({ newPhoneNumber: e.target.value });
    };

    render() {
        const { menu, phnNumbersList, newPhoneNumber, loading, error } = this.state;

        return (
            <div className="hp-hm-header">
                <img src={WebsiteLogo} className="website-logo" alt="Website Logo" />
                <IoMenu className='website-menu-btn' onClick={this.onToggleMenuBtn} />
                <div 
                    className='header-menu-block' 
                    style={{
                        top: menu ? '0' : '-100vh',
                    }}
                >
                    <div className='cross-block'>
                        <RxCross2 
                            onClick={this.onToggleMenuBtn} 
                            style={{
                                color: '#703D58',
                                fontWeight: '600'
                            }} 
                        />
                    </div>
                    <div className='menu-block'>
                        <h1 className='menu-head-1'>Safety Phone Numbers:</h1>
                        
                        {loading && <p className="loading-message">Loading...</p>}
                        {error && <p className="error-message">{error}</p>}
                        
                        {phnNumbersList.length === 0 && !loading ? (
                            <p className="no-numbers-message">No phone numbers saved</p>
                        ) : (
                            phnNumbersList.map((number, index) => (
                                <div key={index} className='phn-number-block'>
                                    <p className='phone-number-edit'>{number}</p>
                                    <button 
                                        className='delete-btn-block'
                                        onClick={() => this.deletePhoneNumber(number)}
                                        disabled={loading}
                                    >
                                        <MdOutlineDelete />
                                    </button>
                                </div>
                            ))
                        )}
                        
                        <div className='add-new-number-block'>
                            <input 
                                type="tel"
                                value={newPhoneNumber}
                                onChange={this.handleInputChange}
                                maxLength="10" 
                                pattern="[0-9]{10}" 
                                placeholder="Add phone number" 
                                disabled={loading}
                            />
                            <button 
                                className='add-new-num-btn'
                                onClick={this.addPhoneNumber}
                                disabled={loading || !newPhoneNumber}
                            >
                                <FaPlus />
                            </button>
                        </div>
                    </div>
                    <button className='logout-btn'>
                        Logout
                    </button>
                </div>
            </div>
        );
    }
}

export default HomePageHeader;