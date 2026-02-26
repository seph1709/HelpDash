/**
 * ID OCR Controller
 * Uses Google Vision API if GOOGLE_VISION_API_KEY is set.
 * Falls back to manual input (returns empty strings) if not.
 */
export async function parseGovernmentId(imageBase64: string): Promise<{
  name: string
  address: string
  success: boolean
}> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY

  if (!apiKey) {
    // No API key — provider fills manually
    return { name: '', address: '', success: false }
  }

  try {
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: imageBase64 },
              features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
            },
          ],
        }),
      }
    )

    const data = await response.json()
    const text: string = data.responses?.[0]?.fullTextAnnotation?.text ?? ''

    if (!text) return { name: '', address: '', success: false }

    // Heuristic extraction for Philippine government IDs
    const lines = text.split('\n').map((l: string) => l.trim()).filter(Boolean)

    // Name: look for "Name:" label or use line after common ID fields
    const nameLine =
      lines.find((l: string) => /^(last name|surname|apellido)/i.test(l)) ??
      lines.find((l: string) => /^(name|pangalan)/i.test(l))

    // Address: look for address-like lines
    const addressLine =
      lines.find((l: string) => /^(address|tirahan|permanent)/i.test(l)) ??
      lines.find((l: string) => /\d+.*(?:st|ave|blvd|road|quezon|manila)/i.test(l))

    const name = nameLine ? lines[lines.indexOf(nameLine) + 1] ?? '' : ''
    const address = addressLine ? lines[lines.indexOf(addressLine) + 1] ?? addressLine : ''

    return {
      name: name.trim(),
      address: address.trim(),
      success: !!(name || address),
    }
  } catch (err) {
    console.error('Vision API error:', err)
    return { name: '', address: '', success: false }
  }
}
