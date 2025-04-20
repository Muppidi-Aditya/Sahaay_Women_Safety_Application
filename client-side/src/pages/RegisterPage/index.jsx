import { Component } from "react";
import './index.css'
import LoginPageHeader from "../../components/LoginPageHeader";
import Cookies from 'js-cookie';

class RegisterPage extends Component {
    state = {
        username: '',
        phoneNumber: '',
        email: '',
        password: '',
        error: '',
    };

    handleChange = (e) => {
        this.setState({
            [e.target.name]: e.target.value
        });
    };

    handleSubmit = async (e) => {
        e.preventDefault();
        const { username, phoneNumber, email, password } = this.state;
        
        try {
            // Basic client-side validation
            if (!username || !phoneNumber || !email || !password) {
                this.setState({ error: 'All fields are required' });
                return;
            }
    
            if (phoneNumber.length !== 10 || !/^\d+$/.test(phoneNumber)) {
                this.setState({ error: 'Phone number must be 10 digits' });
                return;
            }
    
            const response = await fetch('http://localhost:5001/api/signup/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                    displayName: username,
                    phoneNumber,
                    // You can add phoneNumber to the body if your backend supports it
                    // phoneNumber: phoneNumber
                }),
            });
    
            const data = await response.json();
    
            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }
    
            // Registration successful
            console.log('Registration successful:', data);
            Cookies.set('auth', data.user.uid);
            // You might want to redirect to login page or directly log the user in
            // For example:
            // this.props.history.push('/login');
            // Or store the token and user data if you want to keep them logged in
            
            // Clear form
            this.setState({
                username: '',
                phoneNumber: '',
                email: '',
                password: '',
                error: ''
            });
        } catch (error) {
            console.error('Registration error:', error);
            this.setState({ error: error.message || 'Registration failed. Please try again.' });
        }
    };

    render () {
        const { username, phoneNumber, email, password, error } = this.state;
        return (
            <div className="login-page">
                <LoginPageHeader />
                <div className="login-page-main-block">
                    <form className="login-details-block" onSubmit={this.handleSubmit}>
                        {error && <div className="error-message">{error}</div>}
                        <input 
                            type="text" 
                            name="username"
                            value={username}
                            onChange={this.handleChange}
                            placeholder="Enter username" 
                            className="login-input-block" 
                            required
                        />
                        <input 
                            type="tel" 
                            name="phoneNumber"
                            value={phoneNumber}
                            onChange={this.handleChange}
                            maxLength="10" 
                            pattern="[0-9]{10}" 
                            placeholder="Enter phone number" 
                            className="login-input-block" 
                            required
                        />
                        <input 
                            type="email" 
                            name="email"
                            value={email}
                            onChange={this.handleChange}
                            placeholder="Enter email" 
                            className="login-input-block" 
                            required
                        />
                        <input 
                            type="password" 
                            name="password"
                            value={password}
                            onChange={this.handleChange}
                            placeholder="Enter password" 
                            className="login-input-block" 
                            required
                        />
                        <button type="submit" className="login-btn">Register</button>
                        <p className="register-text">Already having an account?<span>Login</span></p>
                    </form>
                </div>
            </div>
        )
    }
}

export default RegisterPage