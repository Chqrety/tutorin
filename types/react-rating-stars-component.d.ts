// types/react-rating-stars-component.d.ts

declare module 'react-rating-stars-component' {
    import { ComponentType } from 'react';
  
    interface ReactStarsProps {
      count?: number;
      value?: number;
      onChange?: (newRating: number) => void;
      size?: number;
      isHalf?: boolean;
      edit?: boolean;
      activeColor?: string;
      color?: string;
      emptyIcon?: JSX.Element;
      halfIcon?: JSX.Element;
      filledIcon?: JSX.Element;
      // Tambahkan props lain sesuai kebutuhan Anda atau dokumentasi paket
    }
  
    const ReactStars: ComponentType<ReactStarsProps>;
  
    export default ReactStars;
  }
  