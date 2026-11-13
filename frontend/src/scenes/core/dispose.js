/** Bebaskan geometry, material, dan texture semua anak objek (agents.md §4). */
export function disposeObject(root) {
  root.traverse((obj) => {
    obj.geometry?.dispose();
    const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
    for (const m of mats) {
      for (const value of Object.values(m)) {
        if (value && typeof value === 'object' && value.isTexture) value.dispose();
      }
      m.dispose();
    }
  });
}
