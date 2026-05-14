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

interface IIIFAnnotationPage {
  id: string;
  type: 'AnnotationPage';
  items: IIIFAnnotation[];
}

interface IIIFScene {
  id: string;
  type: 'Scene';
  label?: IIIFLangMap;
  summary?: IIIFLangMap;
  annotations?: IIIFAnnotationPage[];
}

interface IIIFManifest {
  id: string;
  type: 'Manifest';
  items?: IIIFScene[];
}

function getLabel(langMap?: IIIFLangMap): string {
  return langMap?.en?.[0] ?? '';
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

function findChoiceItems(scene: IIIFScene): IIIFLinkingAnnotation[] {
  for (const page of scene.annotations ?? []) {
    for (const anno of page.items ?? []) {
      if (anno.motivation.includes('supplementing')) {
        const body = anno.body as IIIFChoice;
        if (body?.type === 'Choice') return body.items;
      }
    }
  }
  return [];
}

function renderDecisions(choices: IIIFLinkingAnnotation[]): void {
  const section = document.getElementById('decision-section') as HTMLElement;
  const container = document.getElementById('decisions') as HTMLElement;
  container.innerHTML = '';

  if (choices.length === 0) {
    section.hidden = true;
    return;
  }

  section.hidden = false;
  for (const choice of choices) {
    const url = choice.body?.id ?? '';
    const card = document.createElement('div');
    card.className = 'card';
    card.style.width = '280px';
    card.innerHTML = `
      <div class="card-body d-flex flex-column">
        <h5 class="card-title">${getLabel(choice.label)}</h5>
        <p class="card-text flex-grow-1">${getLabel(choice.summary)}</p>
        <button class="btn btn-primary mt-2 choose-btn"${url ? '' : ' disabled'}>Choose</button>
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
    if (scene) {
      renderSceneInfo(scene);
      renderDecisions(findChoiceItems(scene));
    }
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
