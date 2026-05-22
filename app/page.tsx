import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Showcase from '@/components/Showcase';
import HowToPreOrder from '@/components/HowToPreOrder';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Showcase />
        <HowToPreOrder />
      </main>
      <Footer />
    </div>
  );
}
