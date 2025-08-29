'use client';

import React, { useState } from 'react';

// This component will be a wrapper that decides which interactive element to render based on props.

interface InteractiveContentProps {
  type: 'tabs' | 'accordion' | 'carousel';
  items: {
    title: string; // For tabs and accordion headers
    content: string; // For tab and accordion content
    imageUrl?: string; // For carousel images
    altText?: string; // For carousel image alt text
  }[];
}

const Tabs: React.FC<Pick<InteractiveContentProps, 'items'>> = ({ items }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div>
      <div className="flex border-b">
        {items.map((item, index) => (
          <button
            key={index}
            className={`py-2 px-4 font-medium text-sm focus:outline-none ${
              activeIndex === index
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveIndex(index)}
          >
            {item.title}
          </button>
        ))}
      </div>
      <div className="p-4 bg-white border border-t-0 rounded-b-md">
        {items[activeIndex] && <div dangerouslySetInnerHTML={{ __html: items[activeIndex].content }} />}
      </div>
    </div>
  );
};

const Accordion: React.FC<Pick<InteractiveContentProps, 'items'>> = ({ items }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="border rounded-md">
      {items.map((item, index) => (
        <div key={index} className="border-b last:border-b-0">
          <button
            className="w-full flex justify-between items-center p-4 text-left font-medium text-gray-800 hover:bg-gray-50 focus:outline-none"
            onClick={() => toggle(index)}
          >
            <span>{item.title}</span>
            <span>{activeIndex === index ? '−' : '+'}</span>
          </button>
          {activeIndex === index && (
            <div className="p-4 bg-gray-50 text-gray-700" dangerouslySetInnerHTML={{ __html: item.content }} />
          )}
        </div>
      ))}
    </div>
  );
};

const Carousel: React.FC<Pick<InteractiveContentProps, 'items'>> = ({ items }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? items.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const isLastSlide = currentIndex === items.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  return (
    <div className="relative w-full" data-carousel="slide">
      <div className="relative h-56 overflow-hidden rounded-lg md:h-96">
        {items.map((item, index) => (
          <div key={index} className={`${currentIndex === index ? '' : 'hidden'}`} data-carousel-item>
            <img src={item.imageUrl} className="absolute block w-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" alt={item.altText || 'Carousel image'} />
          </div>
        ))}
      </div>
      <button type="button" className="absolute top-0 left-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none" data-carousel-prev onClick={goToPrevious}>
        {/* ... Previous Button SVG ... */}
      </button>
      <button type="button" className="absolute top-0 right-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none" data-carousel-next onClick={goToNext}>
        {/* ... Next Button SVG ... */}
      </button>
    </div>
  );
};

const InteractiveContent: React.FC<InteractiveContentProps> = ({ type, items }) => {
  switch (type) {
    case 'tabs':
      return <Tabs items={items} />;
    case 'accordion':
      return <Accordion items={items} />;
    case 'carousel':
      return <Carousel items={items} />;
    default:
      return null;
  }
};

export default InteractiveContent;