import { RiRobot3Line } from "react-icons/ri";
import { LuUserRound } from "react-icons/lu";
import { marked } from 'marked';
import './index.css'

const ChatBotMsgComponent = props => {
    const { msgDetails } = props;
    const {msg, from} = msgDetails

    const createMarkup = () => {
        return { __html: marked.parse(msg) };
    };

    return (
        from == 'bot' ? (
            <div className='chat-block'>
                <div className="from-icon-block">
                    <RiRobot3Line style = {{
                        fontSize: '22px'
                    }} />
                </div>
                <div dangerouslySetInnerHTML={createMarkup()} className="chat-block-content">

                </div>
            </div>
        ) : (
            <div className='chat-block' style = {{
                justifyContent: 'end'
            }}>
                 <p className="chat-block-content"> {msg} </p>
                 <div className="from-icon-block">
                    <LuUserRound  style = {{
                        fontSize: '22px'
                    }}/>
                </div>
            </div>
        )
    )
}

export default ChatBotMsgComponent