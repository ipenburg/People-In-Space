PGraphics pg;

int alpha = 75;
float reach = .8;
int frames = 24;
int screen_width = 40;
int screen_height = frames * screen_width;
float sweep = TWO_PI / 9;

void setup() {
  pg = createGraphics(screen_width, screen_height, JAVA2D);
}

float s = 0;

void draw() {
  pg.beginDraw();
  pg.translate(screen_width / 2, screen_width / 2);
  int frame;
  for (frame = 0; frame < frames; frame++) {
    s = frame * TWO_PI / frames;
    for (float a = s; a < s + sweep; a += TWO_PI / 360) {
      pg.stroke(255, 255, 255, alpha * ((a - s) / sweep));
      pg.strokeWeight(1);
      pg.line(0, 0,
        reach * (screen_width / 2) * cos(a),
        reach * (screen_width / 2) * sin(a)
      );
    }
    pg.translate(0, screen_width);
  }
  pg.endDraw();
  pg.save("spinner_radar_40x40.png");
  exit();

}
