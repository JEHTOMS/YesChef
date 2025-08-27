import '../pages/Home.css';
import '../index.css';

function Input(props) {
    return (
            <div className="input-container">
                <textarea onChange={props.textChange} className="input-field title" id="food-query" placeholder="What are you making for dinner?" />
            </div>
    );
}

export default Input;
