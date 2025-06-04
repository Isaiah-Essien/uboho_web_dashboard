import React from 'react';

export default function CustomAuthImage({ imageUrl, altText = 'Auth page image' }) {
  return (
    <div className="image-panel">
      <img src={imageUrl} alt={altText} className="main-image" />
    </div>
  );
}
