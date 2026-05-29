import Phaser from 'phaser';
import { TEXT_STYLES } from '../game/theme';
import { drawPanel } from './drawables';

interface HudValues {
  bombs: number;
  fire: number;
  speed: number;
  rivals: number;
}

interface StatCard {
  value: Phaser.GameObjects.Text;
}

export class Hud extends Phaser.GameObjects.Container {
  private readonly cards: Record<keyof HudValues, StatCard>;

  constructor(scene: Phaser.Scene, x: number, y: number, initialValues: HudValues) {
    super(scene, x, y);

    this.add(drawPanel(scene, 0, 0, 624, 72, 'hudPanel'));

    const title = scene.add.text(20, 11, 'ARENA READOUT', {
      ...TEXT_STYLES.hudLabel,
      fontSize: '15px',
      color: '#ffe9ad',
    });
    title.setShadow(0, 1, '#12243f', 2, false, true);
    this.add(title);

    const labels: Array<{ key: keyof HudValues; label: string; x: number }> = [
      { key: 'bombs', label: 'BOMBS READY', x: 210 },
      { key: 'fire', label: 'BLAST POWER', x: 320 },
      { key: 'speed', label: 'SPEED', x: 430 },
      { key: 'rivals', label: 'RIVALS', x: 540 },
    ];

    this.cards = labels.reduce<Record<keyof HudValues, StatCard>>((cards, item) => {
      const label = scene.add.text(item.x, 16, item.label, {
        ...TEXT_STYLES.hudLabel,
        color: '#a8ebff',
      });
      label.setOrigin(0.5, 0);
      const value = scene.add.text(item.x, 32, '', TEXT_STYLES.hudValue).setOrigin(0.5, 0);
      this.add([label, value]);
      cards[item.key] = { value };
      return cards;
    }, {} as Record<keyof HudValues, StatCard>);

    this.setValues(initialValues);
    scene.add.existing(this);
  }

  setValues(values: HudValues): void {
    (Object.keys(values) as Array<keyof HudValues>).forEach((key) => {
      this.cards[key].value.setText(String(values[key]));
    });
  }
}
