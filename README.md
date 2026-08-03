# LLM Model Analysis Dashboard

Compare LLMs by price, benchmark performance, and overall value.

Dashboard: [https://modelanalysis.xyz](https://modelanalysis.xyz)

## Features

### Value-Based Rankings

Adjust the cost sensitivity slider (**$P$**) to see how rankings change as price becomes more or less important.

$$
\text{Value} = \frac{\text{Performance}}{\text{Blended Cost}^P}
$$

### Charts and Comparisons

- Cost vs. performance scatter plot
- Pareto frontier highlighting efficient models
- Radar chart for side-by-side model comparisons
- Sortable rankings by value, performance, cost, LiveBench, or Artificial Analysis score

### Search and Filtering

- Search by model or provider
- Filter providers
- Set price limits
- Set a minimum performance threshold

### Themes

- Dark and light modes (Monospaced Terminal / IDE styling)
- Automatic system theme preference detection (defaults to dark mode if no preference is found)
- Preference saved locally in your browser when explicitly toggled

## Tech Stack

- HTML
- CSS
- JavaScript
- Chart.js

## Running Locally

The dashboard loads data from `data.json`, so it must be served through a local web server.

```bash
git clone https://github.com/isr431/model-analysis.git
cd model-analysis
python3 -m http.server
```

Then open:

```text
http://localhost:8000
```

## Updating Model Data

Model data lives in `data.json`.

Prices (`inputPrice`, `outputPrice`, `cachePrice`) are auto-refreshed daily at 00:00 UTC from the
[OpenRouter models API](https://openrouter.ai/api/v1/models?output_modalities=all) by
`scripts/update-prices.mjs`, run via GitHub Actions (`.github/workflows/update-prices.yml`).
Run it manually with `node scripts/update-prices.mjs`.

Add a model:

```json
{
  "provider": "OpenAI",
  "model": "gpt-oss-120b",
  "inputPrice": 0.037,
  "outputPrice": 0.17,
  "cachePrice": 0.0037,
  "livebench": 46.09,
  "aaScore": 24,
  "open": true
}
```

`open` marks whether the model's weights are publicly released (`true`) or closed/proprietary (`false`). It powers the "Open" badge and the Source filter (All / Open / Closed).

If you're adding a new provider, also add its color to the `providers` object.

## AI Assistant

The dashboard includes a built-in AI assistant powered by OpenRouter.

### What it can do

- Answer questions about the current leaderboard
- Search, filter, and rank models by price, performance, value, or open weights
- Compare models in the active dataset
- Read your current filters and settings, and explain why a model is filtered out
- Apply filters for you — "show me only open models under $1" updates the dashboard
- Show pricing and benchmark information
- Support different reasoning levels for compatible models

### Setup

1. Open the chat panel using the floating chat assistant button.
2. Click the **Settings** icon.
3. Enter your OpenRouter API key.
4. Choose a model and start asking questions.

Your API key is stored locally in your browser and is only sent to OpenRouter.

## Methodology

### Blended Cost

A weighted cost estimate based on a 22.4:1 input-to-output token ratio.

$$
\text{Blended Cost} = (0.9573 \times \text{Input Price}) + (0.0427 \times \text{Output Price})
$$

### Performance

Performance is a weighted blend of the normalized LiveBench and Artificial Analysis scores.

$$
\text{Performance} = \left( w_{\text{LB}} \cdot \frac{\text{LiveBench}}{\max(\text{LiveBench})} + w_{\text{AA}} \cdot \frac{\text{AA Score}}{\max(\text{AA Score})} \right) \times 100
$$

Normalizing by each benchmark's maximum pins the top of both scales to 1, but it leaves their *spreads* untouched — and spread, not the ceiling, decides how much a benchmark actually moves the composite. Artificial Analysis ranges over a much wider slice of its scale than LiveBench does (roughly 1.9× the spread on current data), so an even 50/50 split would in practice give AA about two-thirds of the influence.

The weights correct for this by scaling each benchmark inversely to its spread:

$$
w_{\text{LB}} = \frac{\sigma_{\text{AA}}}{\sigma_{\text{LB}} + \sigma_{\text{AA}}}, \qquad w_{\text{AA}} = \frac{\sigma_{\text{LB}}}{\sigma_{\text{LB}} + \sigma_{\text{AA}}}
$$

where $\sigma$ is the standard deviation of the normalized scores. On current data this gives roughly $w_{\text{LB}} = 0.66$ and $w_{\text{AA}} = 0.34$, which is what an even contribution actually looks like. The weights are recomputed from the loaded dataset rather than hard-coded, so they stay correct as models are added. The live values are shown in the score formula panel.

### Value

Value balances performance against cost.

$$
\text{Value} = \frac{\text{Performance}}{\text{Blended Cost}^P}
$$

- **$P = 0$** → rankings are based only on performance.
- Higher values of **$P$** place more weight on cost.

### Cost Efficiency (Radar Chart)

To compare costs across a wide price range (e.g. from cheap open-weights models to expensive reasoning models) without linear price compression, the radar chart uses a globally anchored logarithmic scale:

$$
\text{Cost Efficiency} = \left( \frac{\log_{10}(\text{Global Max Cost}) - \log_{10}(\text{Model Cost})}{\log_{10}(\text{Global Max Cost}) - \log_{10}(\text{Global Min Cost})} \right) \times 100
$$

- A floor of **$0.01$** is enforced on model costs to handle free models safely.
- Global min/max values are computed across all models in the database to keep the comparison shape stable when filters are applied.

### Pareto Frontier

Models on the Pareto frontier are not beaten by another model on both price and performance at the same time.

## License

Released under the MIT License.
