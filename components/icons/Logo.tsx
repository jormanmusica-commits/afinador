
import React from 'react';

export const Logo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee"/>
            <stop offset="100%" stopColor="#d946ef"/>
            </linearGradient>
        </defs>
        <path d="M12 3L4 9V17H20V9L12 3Z" stroke="url(#logo-gradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 12L20 17" stroke="url(#logo-gradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 12V21" stroke="url(#logo-gradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 12L4 17" stroke="url(#logo-gradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 5L8 9" stroke="url(#logo-gradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
