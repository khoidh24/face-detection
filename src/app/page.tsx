import PoseDetector from "@/components/PoseDetector";

export default function Home() {
  return (
    <main className="min-h-screen bg-black flex justify-center items-center">
      <div className="w-full max-w-md aspect-[3/4] relative">
        <PoseDetector />
      </div>
    </main>
  );
}
