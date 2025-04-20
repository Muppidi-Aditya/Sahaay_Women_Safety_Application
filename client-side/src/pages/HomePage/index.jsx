import { Component } from "react";
import { Link } from "react-router-dom";
import './index.css'
import HomePageHeader from "../../components/HomePageHeader";
import { FaRoute } from "react-icons/fa6";
import { BiSolidBellRing } from "react-icons/bi";
import { RiRobot3Fill } from "react-icons/ri";
import { FaMap } from "react-icons/fa";
import { GrLicense } from "react-icons/gr";
import { FaPhoneVolume } from "react-icons/fa6";
import Cookies from 'js-cookie';

class HomePage extends Component {

    state = {
        username: 'Guest', // Default name
        loading: true,
        error: null,
        email: '',
        phnNumber: '',
    };

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
                    username: data.user.username || 'User',
                    loading: false,
                    email: data.user.email,
                    phnNumber: data.user.phn_number,
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

    render () {
        console.log(this.state)
        const { username } = this.state
        return (
            <div className="home-page-main-bg">
                <HomePageHeader />
                <div className="home-page-main-block">
                    <div className="hp-name-block">
                        <h1> Hello, {username} </h1>
                    </div>
                    <div className="hp-features-main-block">
                        <Link to="/saferoutenavigation" className="hp-feature-link">
                            <div className="hp-feature-block">
                                <FaRoute className="hp-feature-icon" />
                                <p className="hp-feature-text"> Safe Route Navigation </p>
                            </div>
                        </Link>
                        
                        <Link to="/sahaaya" className="hp-feature-link">
                            <div className="hp-feature-block">
                                <RiRobot3Fill className="hp-feature-icon" />
                                <p className="hp-feature-text"> Sahaay AI </p>
                            </div>
                        </Link>
                        
                        <Link to="/crimeheatmap" className="hp-feature-link">
                            <div className="hp-feature-block">
                                <FaMap className="hp-feature-icon" />
                                <p className="hp-feature-text"> Crime Heat Map </p>
                            </div>
                        </Link>
                        
                        <Link to="/licenseplatechecker" className="hp-feature-link">
                            <div className="hp-feature-block">
                                <GrLicense className="hp-feature-icon" />
                                <p className="hp-feature-text"> License Plate Checker </p>
                            </div>
                        </Link>
                        
                        <Link to="/fakephonecall" className="hp-feature-link">
                            <div className="hp-feature-block">
                                <FaPhoneVolume className="hp-feature-icon" />
                                <p className="hp-feature-text"> Fake Phone Call </p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        )
    }
}

export default HomePage;