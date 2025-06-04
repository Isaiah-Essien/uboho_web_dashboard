import React from 'react';
import Logo1 from '../../assets/Logo1.svg'; // Update path if needed

export default function AuthImage({ imageUrl, altText = 'Auth page image' }) {
  return (
    <div className="image-panel">
      <img src={imageUrl} alt={altText} className="main-image" />
      <img src={Logo1} alt="Logo" className="logo-overlay" />
    </div>
  );
}
