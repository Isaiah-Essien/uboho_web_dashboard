import React from 'react';

const CustomAuthImage = ({ imageUrl, altText = 'Auth page image' }) => {
  return (
    <div className="image-panel">
      <img src={imageUrl} alt={altText} className="main-image" />
    </div>
  );
};

export default CustomAuthImage;
