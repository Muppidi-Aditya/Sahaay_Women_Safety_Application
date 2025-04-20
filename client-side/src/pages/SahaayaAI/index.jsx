import { Component } from "react";
import FeatureHeaderBlock from "../../components/FeatureHeaderBlock";
import { FaArrowUp } from "react-icons/fa";

import { v4 as uuidv4 } from 'uuid';

import './index.css'
import ChatBotMsgComponent from "../../components/ChatBotMsgComponent";

class SahaayaAIBot extends Component {
    state = {
        msgsArr: [
            
        ],
        inpMsg: '',
    }

    handleUserMsgInputChange = event => {
        this.setState({
            inpMsg: event.target.value,
        })
    }

    enterChatBotMsg = async () => {
        const {inpMsg, msgsArr} = this.state

        if (!inpMsg.trim()) return;

        const userMsg = {
            from: 'user',
            msg: inpMsg,
            id: uuidv4()
        };

        if(inpMsg) {
            this.setState({
                msgsArr: [...msgsArr, userMsg],
                inpMsg: '',
                isLoading: true
            });

            try {
                // Call Sahaaya API
                const response = await fetch('http://localhost:5001/api/ask-sahaaya', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ prompt: inpMsg })
                });
    
                const data = await response.json();
                
                if (data.success) {
                    const botMsg = {
                        from: 'bot',
                        msg: data.response,
                        id: uuidv4()
                    };
                    
                    this.setState(prevState => ({
                        msgsArr: [...prevState.msgsArr, botMsg],
                        isLoading: false
                    }));
                }
            } catch (error) {
                console.error('Error:', error);
                this.setState({
                    msgsArr: [...msgsArr, {
                        from: 'bot',
                        msg: 'Sorry, I encountered an error. Please try again later.',
                        id: uuidv4()
                    }],
                    isLoading: false
                });
            }
        }
    }

    render () {
        const {msgsArr, inpMsg} = this.state
        
        return (
            <div className="bot-chat-main-bg">
                <FeatureHeaderBlock featureName = 'Sahaaya' />
                <div className="ai-bot-chat-block">
                    {
                        msgsArr.map(each => (
                            <ChatBotMsgComponent msgDetails = {each} key = {each.id} />
                        ))
                    }
                </div>
                <div className="chat-input-block">
                    <input type = 'text' placeholder="Ask, Sahaaya" onChange={this.handleUserMsgInputChange} value={inpMsg} />
                    <div className="chat-sent-btn" onClick={this.enterChatBotMsg}>
                        <FaArrowUp style = {{
                            fontSize: '20px',
                            color: 'white',
                        }} />
                    </div>
                </div>
            </div>
        )
    }
}

export default SahaayaAIBot;