import { AiFillHome } from "react-icons/ai";
import './index.css'

const FeatureHeaderBlock = props => {
    const {featureName} = props
    return (
        <div className="feature-header-block">
            <h1> {featureName} </h1>
            <AiFillHome style = {{
                fontSize: '25px',
            }} />
        </div>
    )
}

export default FeatureHeaderBlock