console.log('fiiinal frontier loaded');

async function loadScene(name: string): Promise<unknown> {
  const response = await fetch(`/scenes/${name}.json`);
  if (!response.ok) throw new Error(`Scene not found: ${name}`);
  return response.json();
}

export { loadScene };
