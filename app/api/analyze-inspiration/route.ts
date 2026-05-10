import { NextResponse } from "next/server";

import { ecoHomeAi } from "@/lib/ai";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_INSPIRATION_IMAGES
} from "@/lib/domain/constants";
import { createInspirationImageRecord } from "@/lib/domain/mock-data";
import { analyzeUploadedInspirationImages } from "@/lib/inspiration/analyze-uploaded-images";

export async function POST(request: Request) {
  const formData = await request.formData();
  const files = formData.getAll("images").filter((entry): entry is File => entry instanceof File);

  if (!files.length) {
    return NextResponse.json(
      { error: "Upload at least one inspiration image." },
      { status: 400 }
    );
  }

  if (files.length > MAX_INSPIRATION_IMAGES) {
    return NextResponse.json(
      { error: `Upload no more than ${MAX_INSPIRATION_IMAGES} images.` },
      { status: 400 }
    );
  }

  const invalidFile = files.find((file) => !ALLOWED_IMAGE_TYPES.includes(file.type));

  if (invalidFile) {
    return NextResponse.json(
      {
        error: `Unsupported file type: ${invalidFile.type || invalidFile.name}.`
      },
      { status: 400 }
    );
  }

  const imageRecords = files.map((file) => createInspirationImageRecord(file));

  try {
    const styleAnalysis = await analyzeUploadedInspirationImages({
      files,
      imageRecords
    });

    return NextResponse.json(
      {
        styleAnalysis,
        inspirationImages: imageRecords
      },
      {
        headers: {
          "x-ecohome-inspiration-source": "pixel-analysis"
        }
      }
    );
  } catch {
    const styleAnalysis = await ecoHomeAi.analyzeInspirationImages(imageRecords);

    return NextResponse.json(
      {
        styleAnalysis,
        inspirationImages: imageRecords
      },
      {
        headers: {
          "x-ecohome-inspiration-source": "filename-fallback"
        }
      }
    );
  }
}
