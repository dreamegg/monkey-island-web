import { SX } from '../shared/styles';
import { ap } from '../../utils/paths';

const ASSET_CATALOG = {
  backgrounds: ['harbor', 'tavern', 'forest', 'beach', 'cave'],
  sprites: [
    { name: 'guybrush', frames: ['guybrush_idle', 'guybrush_walk1', 'guybrush_walk2', 'guybrush_walk3', 'guybrush_walk4'] },
    { name: 'lechuck', frames: ['lechuck_idle', 'lechuck_walk1', 'lechuck_walk2'] },
    { name: 'elaine', frames: ['elaine_idle', 'elaine_walk1', 'elaine_walk2'] },
    { name: 'bartender', frames: ['bartender'] },
    { name: 'three_pirates', frames: ['three_pirates'] },
    { name: 'voodoo_lady', frames: ['voodoo_lady'] },
  ],
  portraits: [
    'guybrush_neutral', 'guybrush_determined', 'guybrush_surprised',
    'bartender_suspicious',
    'elaine_concerned', 'elaine_confident',
    'lechuck_angry', 'lechuck_sinister',
    'voodoo_lady_mysterious',
  ],
};

export default function AssetViewerPanel() {
  return (
    <div style={{ padding: 24, overflowY: 'auto', height: '100%' }}>

      <div style={SX.section}>
        <div style={SX.sectionTitle}>배경 이미지 (Backgrounds)</div>
        <div style={SX.grid}>
          {ASSET_CATALOG.backgrounds.map((id) => (
            <div key={id} style={SX.bgCard}>
              <img
                src={ap(`/assets/backgrounds/${id}.png`)}
                alt={id}
                style={SX.bgImg}
                onError={(e) => { (e.target as HTMLImageElement).style.background = '#222'; }}
              />
              <div style={SX.label}>{id}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={SX.section}>
        <div style={SX.sectionTitle}>스프라이트 (Sprites)</div>
        {ASSET_CATALOG.sprites.map(({ name, frames }) => (
          <div key={name} style={SX.spriteGroup}>
            <div style={SX.spriteName}>{name}</div>
            <div style={SX.spriteRow}>
              {frames.map((frame) => (
                <div key={frame} style={SX.spriteCard}>
                  <img
                    src={ap(`/assets/sprites/${frame}.png`)}
                    alt={frame}
                    style={SX.spriteImg}
                    onError={(e) => { (e.target as HTMLImageElement).style.background = '#1a1a2e'; }}
                  />
                  <div style={SX.frameLabel}>{frame.replace(`${name}_`, '') || frame}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={SX.section}>
        <div style={SX.sectionTitle}>초상화 (Portraits)</div>
        <div style={SX.grid}>
          {ASSET_CATALOG.portraits.map((p) => (
            <div key={p} style={SX.portraitCard}>
              <img
                src={ap(`/assets/portraits/${p}.png`)}
                alt={p}
                style={SX.portraitImg}
                onError={(e) => { (e.target as HTMLImageElement).style.background = '#1a1a2e'; }}
              />
              <div style={{ ...SX.frameLabel, padding: '4px 6px', maxWidth: 96 }}>{p}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={SX.section}>
        <div style={SX.sectionTitle}>뎁스 분석 (Depth Maps)</div>
        <div style={{ color: '#666', fontSize: 11, fontFamily: 'monospace', marginBottom: 10 }}>
          초록 영역 = 워크에어리어 폴리곤 | 노란선 = 원근감 스케일 단계
        </div>
        <div style={SX.grid}>
          {ASSET_CATALOG.backgrounds.map((id) => (
            <div key={id} style={SX.bgCard}>
              <img
                src={ap(`/room-configs/${id}_debug.png`)}
                alt={`${id}_depth`}
                style={SX.bgImg}
                onError={(e) => {
                  const el = e.target as HTMLImageElement;
                  el.style.background = '#222';
                  el.style.display = 'block';
                  el.alt = '분석 결과 없음';
                }}
              />
              <div style={SX.label}>{id} · depth map</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
