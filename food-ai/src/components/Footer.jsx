import React from "react";
import '../pages/Home.css';
import '../index.css';
import Button from "./Button";

function Footer(props) {
    const showPrimary = props.buttonType === 'secondary' ? false : true;
    const showSecondary = props.buttonType === 'primary' ? false : true;
    
    return (
        <div className="footer"><div className="container">
                {showSecondary && (
                    <Button buttonText={props.secondaryButtonText || "Cancel"} showIcon={props.showIcon} icon={props.secondaryButtonIcon} className="secondary" onClick={props.onCancel}>
                    </Button>
                )}
                {showPrimary && (
                    <Button 
                        buttonText={props.primaryButtonText || "Save & Continue"} 
                        showIcon={props.showIcon} 
                        icon={props.primaryButtonIcon} 
                        onClick={props.onTap}
                        disabled={props.disabled}
                    >
                    </Button>
                )}
            </div>
        </div>
    );
}

export default Footer;
