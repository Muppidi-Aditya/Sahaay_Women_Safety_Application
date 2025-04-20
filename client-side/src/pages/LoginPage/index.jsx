import { Component } from "react";
import './index.css';
import LoginPageHeader from "../../components/LoginPageHeader";
import GoogleIcon from '../../assets/Google_Icon.webp';
import { auth, googleProvider } from '../../firebase';
import { signInWithPopup } from 'firebase/auth';
import Cookies from 'js-cookie';
import { Navigate } from 'react-router-dom';

class LoginPage extends Component {
    state = {
        email: '',
        password: '',
        error: ''
    }

    handleInputChange = (e) => {
        const { name, value } = e.target;
        this.setState({ [name]: value });
    };

    handleSubmit = async (e) => {
        e.preventDefault();
        const { email, password } = this.state;

        try {
            const response = await fetch('http://localhost:5001/api/signin/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            this.setState({
                email: '',
                password: ''
            })

            if (response.ok) {
                Cookies.set('auth', data.user.uid); 
            } else {
                this.setState({ error: data.message || 'Login failed' });
            }
        } catch (error) {
            console.error('Login error:', error);
            this.setState({ error: 'Network error occurred' });
        }
    };

    handleGoogleSignIn = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            if (user) {
                Cookies.set('auth', user.uid);
            } 
        } catch (error) {
            console.error('Google Sign-In error:', error);
            this.setState({ error: 'Google Sign-In failed. Please try again.' });
        }
    };

    render() {
        const { email, password, error } = this.state;
        const jwtToken = Cookies.get('auth')
        if (jwtToken !== undefined) {
            return <Navigate to="/" replace />;
        }
        return (
            <div className="login-page">
                <LoginPageHeader />
                <div className="login-page-main-block">
                    <form className="login-details-block" onSubmit={this.handleSubmit}>
                        {error && <div className="error-message">{error}</div>}
                        <input 
                            type="email" 
                            name="email"
                            value={email}
                            onChange={this.handleInputChange}
                            placeholder="Enter email" 
                            className="login-input-block" 
                            required 
                        />
                        <input 
                            type="password" 
                            name="password"
                            value={password}
                            onChange={this.handleInputChange}
                            placeholder="Enter password" 
                            className="login-input-block" 
                            required 
                        />
                        <button type="submit" className="login-btn">Login</button>
                        <div className="or-block">
                            <hr />
                            <p>Or</p>
                            <hr />
                        </div>
                        <button 
                            type="button" 
                            className="continue-w-google-block"
                            onClick={this.handleGoogleSignIn}
                        >
                            <img src={GoogleIcon} alt="Google Icon" />
                        </button>
                        <p className="register-text">
                            Not having an Account? <span>Register</span>
                        </p>
                    </form>
                </div>
            </div>
        );
    }
}

export default LoginPage;