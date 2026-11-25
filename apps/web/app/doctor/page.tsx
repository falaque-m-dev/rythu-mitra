import type { Metadata } from "next";
import { CropDoctor } from "@/components/doctor/crop-doctor";

export const metadata: Metadata = {
  title: "Crop Doctor"
};

export default function DoctorPage() {
  return <CropDoctor />;
}
