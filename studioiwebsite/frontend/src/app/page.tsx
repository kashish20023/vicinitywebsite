import Navbar from "@/components/Navbar";
import HeroSearch from "@/components/HeroSearch";
import HeroSection from "@/components/HeroSection";
import BrandBanner from "@/components/BrandBanner";
import FeaturedLocations from "@/components/FeaturedLocations";
import TestimonialsSection from "@/components/TestimonialsSection";
import FaqSection from "@/components/FaqSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-white flex flex-col selection:bg-[#0e4962] selection:text-white">
      {/* Floating Navbar */}
      <Navbar />

      {/* Hero Quick Search Filter Bar */}
      <HeroSearch />

      {/* Hero Section: Doodles, Heading, Showcase & CTA */}
      <HeroSection />

      {/* Slogan Banner ("Studio i - Your Space. Your Work. Your Way.") */}
      <BrandBanner />

      {/* Featured Properties Showcase: Lehariya & Horizon Tower */}
      <FeaturedLocations />

      {/* Section Divider Matching Canva */}
      <div className="max-w-[1180px] mx-auto w-full px-4 sm:px-6 my-10 max-sm:my-4 sm:my-14">
        <div className="border-t border-neutral-300 w-full" />
      </div>

      {/* Video Reel & Social Testimonials */}
      <TestimonialsSection />

      {/* Section Divider Matching Canva */}
      <div className="max-w-[1180px] mx-auto w-full px-4 sm:px-6 my-10 max-sm:my-4 sm:my-14">
        <div className="border-t border-neutral-300 w-full" />
      </div>

      {/* FAQ Accordion: Got Questions? We've Got Answers */}
      <FaqSection />

      {/* Brand Magenta Footer */}
      <Footer />
    </main>
  );
}
