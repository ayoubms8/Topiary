import React from 'react';

export default function Layout({ children }) {
    return (
        <div className="flex h-screen w-full overflow-hidden text-sm selection:bg-primary/30 bg-dark-bg text-text-main font-sans">
            {children}
        </div>
    );
}
