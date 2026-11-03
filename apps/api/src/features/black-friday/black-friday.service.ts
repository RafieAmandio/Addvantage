import { AppError } from "@/core/errors/index.js";
import { logger } from "@/config/logger.js";
import {
  bfPrice,
  lossToUsd,
  type BlackFridayApplicationInput,
  type BlackFridayDraftInput,
} from "@tradevantage/shared/schema";
import { blackFridayRepository } from "./black-friday.repository.js";

const EDITABLE = new Set(["draft", "submitted"]);

export const UID_TAKEN = "This BingX UID is already registered with another application.";

// One BingX UID per application. The DB unique index is the real guard; this gives a friendly 409 first.
async function assertUidFree(bingxUid: string, email: string) {
  const other = await blackFridayRepository.findByUid(bingxUid);
  if (other && other.email !== email) throw new AppError(UID_TAKEN, 409);
}

// Once the desk has decided, the applicant can't rewrite the application.
function assertEditable(row: { status: string } | null) {
  if (row && !EDITABLE.has(row.status)) {
    throw new AppError("This application has already been reviewed. We'll be in touch by email.", 409);
  }
}

// Race between the check above and the write: the unique index throws P2002.
function rethrowUnique(err: unknown): never {
  if ((err as { code?: string })?.code === "P2002") throw new AppError(UID_TAKEN, 409);
  throw err;
}

export const blackFridayService = {
  async draft(input: BlackFridayDraftInput) {
    if (input.bingxUid) await assertUidFree(input.bingxUid, input.email);
    assertEditable(await blackFridayRepository.findByEmail(input.email));
    const row = await blackFridayRepository.upsertDraft(input).catch(rethrowUnique);
    return { status: row.status };
  },

  async submit(input: BlackFridayApplicationInput) {
    await assertUidFree(input.bingxUid, input.email);
    assertEditable(await blackFridayRepository.findByEmail(input.email));

    // Price is server-authoritative; the schema already refused a full plan without a priced method.
    const price = input.plan === "full" && input.paymentMethod ? bfPrice(input.paymentMethod) : null;
    const full = input.plan === "full";

    const row = await blackFridayRepository
      .finalize({
        email: input.email,
        name: input.name,
        contact: input.contact,
        answers: input.answers,
        biggestLossAmount: input.biggestLossAmount,
        biggestLossCurrency: input.biggestLossCurrency,
        biggestLossUsd: lossToUsd(input.biggestLossAmount, input.biggestLossCurrency),
        bingxUid: input.bingxUid,
        bingxProofPath: input.bingxProofPath,
        plan: input.plan,
        paymentMethod: full ? (input.paymentMethod ?? null) : null,
        paymentAmount: price?.amount ?? null,
        paymentCurrency: price?.currency ?? null,
        paymentProofPath: full ? (input.paymentProofPath ?? null) : null,
        signedName: input.signedName,
        signedAt: new Date(),
        acknowledgements: input.acknowledgements,
      })
      .catch(rethrowUnique);

    logger.info({ id: row.id, plan: input.plan }, "black-friday: application submitted");
    return { id: row.id };
  },
};
