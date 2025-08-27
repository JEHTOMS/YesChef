import React from "react";
import '../pages/Home.css';
import '../index.css';

function Button(props) {
    const buttonClass = props.className === 'secondary' ? 'sec-button' : 'pri-button';
    
    return (
        <button className={`${buttonClass} text-lg`} onClick={props.onClick}>
            {props.showIcon && props.icon && (
                <div>{props.icon}</div>
            )}
            {props.buttonText}
        </button>
    );
}

export default Button;
