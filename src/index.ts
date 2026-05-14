const VOYAGER_BASE = 'https://smithsonian.github.io/voyager-dev/iiif/iiif_demo.html?document=';
const DEFAULT_MANIFEST_URL = 'https://juliewinchester.github.io/fiiinal-frontier/scenes/intro.json';

interface IIIFLangMap { en?: string[] }

interface IIIFBodyResource {
  id?: string;
  type?: string;
}

interface IIIFChoice {
  type: 'Choice';
  items: IIIFLinkingAnnotation[];
}

interface IIIFLinkingAnnotation {
  id: string;
  type: 'Annotation';
  motivation: string[];
  label?: IIIFLangMap;
  summary?: IIIFLangMap;
  body?: IIIFBodyResource;
}

interface IIIFAnnotation {
  id: string;
  type: 'Annotation';
  motivation: string[];
  body?: IIIFBodyResource | IIIFChoice;
}

interface IIIFScene {
  id: string;
  type: 'Scene';
  label?: IIIFLangMap;
  summary?: IIIFLangMap;
}

interface IIIFManifest {
  id: string;
  type: 'Manifest';
  items?: IIIFScene[];
}

function getLabel(langMap?: IIIFLangMap): string {
  return langMap?.en?.[0] ?? '';
}

// Derives the sidecar URL by inserting supplementing-annotations/ after /scenes/.
// Preserves any subdirectory structure within scenes/:
//   .../scenes/intro.json         -> .../scenes/supplementing-annotations/intro.json
//   .../scenes/end/outro.json     -> .../scenes/supplementing-annotations/end/outro.json
// Returns null if /scenes/ is not found in the URL (e.g. external manifests).
function deriveSidecarUrl(manifestUrl: string): string | null {
  const parsed = new URL(manifestUrl);
  const marker = '/scenes/';
  const idx = parsed.pathname.indexOf(marker);
  if (idx === -1) return null;
  const afterScenes = parsed.pathname.slice(idx + marker.length);
  parsed.pathname = parsed.pathname.slice(0, idx + marker.length) + 'supplementing-annotations/' + afterScenes;
  return parsed.href;
}

function renderVoyager(manifestUrl: string): void {
  const viewer = document.getElementById('viewer') as HTMLIFrameElement;
  viewer.src = '';
  setTimeout(() => {
    viewer.src = VOYAGER_BASE + encodeURIComponent(manifestUrl);
  }, 100);
}

function renderSceneInfo(scene: IIIFScene): void {
  (document.getElementById('scene-label') as HTMLElement).textContent = getLabel(scene.label);
  (document.getElementById('scene-summary') as HTMLElement).textContent = getLabel(scene.summary);
}

async function loadSidecarChoices(sidecarUrl: string): Promise<IIIFLinkingAnnotation[]> {
  try {
    const response = await fetch(sidecarUrl);
    if (!response.ok) return [];
    const anno: IIIFAnnotation = await response.json();
    if (!anno.motivation.includes('supplementing')) return [];
    const body = anno.body as IIIFChoice;
    if (body?.type === 'Choice') return body.items;
  } catch {
    // no sidecar for this scene
  }
  return [];
}

const CHOOSE_LABELS = ['Engage', 'Make It So', 'Hit It'];

function renderDecisions(choices: IIIFLinkingAnnotation[]): void {
  const section = document.getElementById('decision-section') as HTMLElement;
  const container = document.getElementById('decisions') as HTMLElement;
  container.innerHTML = '';

  if (choices.length === 0) {
    section.hidden = true;
    return;
  }

  section.hidden = false;
  for (const [i, choice] of choices.entries()) {
    const url = choice.body?.id ?? '';
    const buttonLabel = CHOOSE_LABELS[i % CHOOSE_LABELS.length];
    const card = document.createElement('div');
    card.className = 'card';
    card.style.width = '280px';
    card.innerHTML = `
      <div class="card-body d-flex flex-column">
        <h5 class="card-title">${getLabel(choice.label)}</h5>
        <p class="card-text flex-grow-1">${getLabel(choice.summary)}</p>
        <button class="btn btn-primary mt-2 choose-btn"${url ? '' : ' disabled'}>${buttonLabel}</button>
      </div>
    `;
    card.querySelector('.choose-btn')!.addEventListener('click', () => loadManifest(url));
    container.appendChild(card);
  }
}

async function loadManifest(url: string): Promise<void> {
  (document.getElementById('manifest-url') as HTMLInputElement).value = url;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const manifest: IIIFManifest = await response.json();

    renderVoyager(url);

    const scene = manifest.items?.[0];
    if (scene) renderSceneInfo(scene);

    const sidecarUrl = deriveSidecarUrl(url);
    const choices = sidecarUrl ? await loadSidecarChoices(sidecarUrl) : [];
    renderDecisions(choices);
  } catch (err) {
    console.error('Failed to load manifest:', err);
    alert('Failed to load manifest. Check the URL and try again.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('load-manifest')?.addEventListener('click', () => {
    const url = (document.getElementById('manifest-url') as HTMLInputElement).value.trim();
    if (url) loadManifest(url);
  });

  loadManifest(DEFAULT_MANIFEST_URL);
});
