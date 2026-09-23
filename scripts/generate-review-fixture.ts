import { writeFileSync, mkdirSync } from "node:fs";
import { reviewFixture } from "../tests/v2/review-fixture.js";
mkdirSync("review", { recursive: true });
writeFileSync("review/fixture.json", JSON.stringify(reviewFixture(), null, 2));
