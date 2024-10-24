import CaptiveScrollCarousel from '@/components/CaptiveScrollCarousel';
import { Carousel } from '@components/ui/carousel';

const YourPage: React.FC = () => {
  return (
    <CaptiveScrollCarousel background="/path/to/your/image.jpg">
      <div className="rounded-lg bg-white p-8 shadow-lg">
        <h2 className="text-2xl font-bold">Item 1</h2>
        <p>Description for item 1</p>
      </div>
      <div className="rounded-lg bg-white p-8 shadow-lg">
        <h2 className="text-2xl font-bold">Item 2</h2>
        <p>Description for item 2</p>
      </div>
      <div className="rounded-lg bg-white p-8 shadow-lg">
        <h2 className="text-2xl font-bold">Item 3</h2>
        <p>Description for item 3</p>
      </div>
      <div className="rounded-lg bg-white p-8 shadow-lg">
        <h2 className="text-2xl font-bold">Item 1</h2>
        <p>Description for item 1</p>
      </div>
      <div className="rounded-lg bg-white p-8 shadow-lg">
        <h2 className="text-2xl font-bold">Item 2</h2>
        <p>Description for item 2</p>
      </div>
      <div className="rounded-lg bg-white p-8 shadow-lg">
        <h2 className="text-2xl font-bold">Item 3</h2>
        <p>Description for item 3</p>
      </div>
      <div className="rounded-lg bg-white p-8 shadow-lg">
        <h2 className="text-2xl font-bold">Item 1</h2>
        <p>Description for item 1</p>
      </div>
      <div className="rounded-lg bg-white p-8 shadow-lg">
        <h2 className="text-2xl font-bold">Item 2</h2>
        <p>Description for item 2</p>
      </div>
      <div className="rounded-lg bg-white p-8 shadow-lg">
        <h2 className="text-2xl font-bold">Item 3</h2>
        <p>Description for item 3</p>
      </div>
    </CaptiveScrollCarousel>
  );
};

export default YourPage;
