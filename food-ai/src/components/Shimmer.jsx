import React from "react";
import './Shimmer.css';

function Shimmer() {
    return (
       <div className="main-content" style={{ height: '100%', overflow: 'hidden' }}>
            <div className="container layout-sm" style={{ height: '100svh', position: 'relative',  paddingBottom: 80 }}>
        <div className="savedrecipes-shimmer"></div>
        <div className="input-shimmer">
            <div className="button-shimmer"></div>
        </div>
        </div>
        </div>
    );
}

export default Shimmer;