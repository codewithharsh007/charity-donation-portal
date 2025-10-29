import Hero from "@/components/Hero";
import AboutPreview from "@/components/AboutPreview";
import ProcessForWebsite from "@/components/processForWebsite";
import FeedbackCard from "@/components/Feedback";
import UserStories from "@/components/Story";
import AIPage from "@/components/FloatingHelp";


export default function Home() {
  return (
    <>
      <div className="min-h-screen">
        <Hero />
        <ProcessForWebsite />
        <FeedbackCard />
        <UserStories />
        <AboutPreview />
      </div>
      <AIPage />
    </>
  );
}


