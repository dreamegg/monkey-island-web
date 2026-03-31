import { useState, useEffect } from 'react';
import { S } from './shared/styles';
import { getAllRooms } from '../engine/RoomLoader';
import { initDialogues } from '../data/dialogues';
import { preloadAllDepthConfigs } from '../engine/DepthSystem';
import { preloadAllSegmentation } from '../engine/SegmentationSystem';
import { preloadAllBackgrounds, loadImage } from '../utils/assetLoader';
import { ap } from '../utils/paths';

import RoomEditorPanel from './panels/RoomEditorPanel';
import DialogueViewerPanel from './panels/DialogueViewerPanel';
import ItemManagerPanel from './panels/ItemManagerPanel';
import RoomMapPanel from './panels/RoomMapPanel';
import AssetViewerPanel from './panels/AssetViewerPanel';
import AssetManagerPanel from './panels/AssetManagerPanel';
import CharacterManagerPanel from './panels/CharacterManagerPanel';

const ROOMS = getAllRooms();

type TabId = 'rooms' | 'dialogues' | 'items' | 'map' | 'assets' | 'assetmanager' | 'characters';

export default function DevToolsApp() {
  const [tab, setTab] = useState<TabId>('rooms');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initDialogues();
    preloadAllBackgrounds();
    const roomIds = Object.keys(ROOMS);
    preloadAllDepthConfigs(roomIds).then(() => setReady(true));
    preloadAllSegmentation(roomIds);
    roomIds.forEach((id) => loadImage(ap(`/room-configs/${id}_depth.png`)).catch(() => {}));
  }, []);

  const tabs: { id: TabId; label: string }[] = [
    { id: 'rooms', label: 'Room Editor' },
    { id: 'dialogues', label: 'Dialogue Viewer' },
    { id: 'items', label: 'Items & Inventory' },
    { id: 'map', label: 'Room Map' },
    { id: 'assets', label: 'Assets' },
    { id: 'assetmanager', label: 'Assets ✦' },
    { id: 'characters', label: 'Characters' },
  ];

  return (
    <div style={S.app}>
      <div style={S.header}>
        <span style={S.title}>DEV TOOLS</span>
        <div style={S.tabs}>
          {tabs.map((t) => (
            <button key={t.id} style={S.tab(tab === t.id)} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#666' }}>
          {ready ? 'Depth configs loaded' : 'Loading...'}
        </span>
      </div>
      <div style={S.body}>
        {tab === 'rooms' && <RoomEditorPanel />}
        {tab === 'dialogues' && <DialogueViewerPanel />}
        {tab === 'items' && <ItemManagerPanel />}
        {tab === 'map' && <RoomMapPanel />}
        {tab === 'assets' && <AssetViewerPanel />}
        {tab === 'assetmanager' && <AssetManagerPanel />}
        {tab === 'characters' && <CharacterManagerPanel />}
      </div>
    </div>
  );
}
