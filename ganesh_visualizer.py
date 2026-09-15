"""
=============================================================================
 Project : Lord Ganesha Particle Art Visualizer
 Author  : Wastav Nagture
 GitHub  : https://github.com/wastavnagture97-pixel
 Site    : https://wastavnagture97-pixel.github.io/
=============================================================================
"""

__author__ = "Wastav Nagture"
__portfolio__ = "https://wastavnagture97-pixel.github.io/"
__github__ = "https://github.com/wastavnagture97-pixel"

import math
import os
import random
import sys

import cv2
import pygame

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

IMAGE_PATH = os.path.join(SCRIPT_DIR, "image.png")
if not os.path.exists(IMAGE_PATH):
    IMAGE_PATH = os.path.join(SCRIPT_DIR, "image_2.png")

AUDIO_PATH = os.path.join(SCRIPT_DIR, "audio.mp3")
if not os.path.exists(AUDIO_PATH):
    AUDIO_PATH = os.path.join(SCRIPT_DIR, "audio.wav")

WIDTH, HEIGHT = 1280, 720
FPS = 60


def print_author_banner():
    banner = f"""
{"=" * 62}
  🕉️  LORD GANESHA PARTICLE ART VISUALIZER
  Passionately built by Wastav Nagture
  Portfolio : {__portfolio__}
  GitHub    : {__github__}
  Audio     : Gajanana (Bajirao Mastani)
{"=" * 62}
"""
    print(banner)


def draw_secret_modal(screen, width, height, font_title, font_body, font_sub):
    # Dim background
    overlay = pygame.Surface((width, height), pygame.SRCALPHA)
    overlay.fill((0, 0, 0, 190))
    screen.blit(overlay, (0, 0))

    # Dialog card
    card_w, card_h = 580, 295
    card_x = (width - card_w) // 2
    card_y = (height - card_h) // 2

    card = pygame.Surface((card_w, card_h), pygame.SRCALPHA)
    pygame.draw.rect(card, (18, 12, 24, 245), (0, 0, card_w, card_h), border_radius=14)
    pygame.draw.rect(
        card, (255, 215, 0, 190), (0, 0, card_w, card_h), width=2, border_radius=14
    )

    t_title = font_title.render("🕉️ GANESHA VISUALIZER", True, (255, 215, 0))
    t_desc = font_sub.render(
        "Particle Art Reconstruction & Ambient Physics", True, (200, 200, 215)
    )
    t_line = font_sub.render("—" * 40, True, (80, 70, 95))
    t_credit = font_body.render(
        "Passionately built by Wastav Nagture", True, (255, 255, 255)
    )
    t_audio = font_sub.render(
        "🎵 Audio: Gajanana | Bajirao Mastani", True, (255, 205, 110)
    )
    t_port = font_sub.render(
        "Portfolio: https://wastavnagture97-pixel.github.io/", True, (255, 195, 80)
    )
    t_git = font_sub.render(
        "GitHub: https://github.com/wastavnagture97-pixel", True, (130, 200, 255)
    )
    t_close = font_sub.render(
        "[ 'C' Info | 'M' Mute/Unmute | 'ESC' Exit ]", True, (150, 150, 160)
    )

    card.blit(t_title, ((card_w - t_title.get_width()) // 2, 20))
    card.blit(t_desc, ((card_w - t_desc.get_width()) // 2, 50))
    card.blit(t_line, ((card_w - t_line.get_width()) // 2, 68))
    card.blit(t_credit, ((card_w - t_credit.get_width()) // 2, 94))
    card.blit(t_audio, ((card_w - t_audio.get_width()) // 2, 126))
    card.blit(t_port, ((card_w - t_port.get_width()) // 2, 154))
    card.blit(t_git, ((card_w - t_git.get_width()) // 2, 182))
    card.blit(t_close, ((card_w - t_close.get_width()) // 2, 240))

    screen.blit(card, (card_x, card_y))


def draw_credits(screen, width, height, font, is_hovered=False, is_muted=False):
    # Subtle signature watermark
    alpha = 200 if is_hovered else 100
    text_color = (255, 225, 150) if is_hovered else (220, 210, 190)

    audio_status = " 🔇" if is_muted else " 🎵"
    text_surf = font.render(
        f"Built by Wastav Nagture  •  [C] Info  •  [M] Mute{audio_status}",
        True,
        text_color,
    )
    text_surf.set_alpha(alpha)

    padding_x, padding_y = 10, 5
    bw = text_surf.get_width() + padding_x * 2
    bh = text_surf.get_height() + padding_y * 2

    pos_x = width - bw - 15
    pos_y = height - bh - 12

    badge = pygame.Surface((bw, bh), pygame.SRCALPHA)
    bg_alpha = 140 if is_hovered else 60
    border_alpha = 180 if is_hovered else 70

    pygame.draw.rect(badge, (10, 5, 15, bg_alpha), (0, 0, bw, bh), border_radius=6)
    pygame.draw.rect(
        badge, (255, 215, 0, border_alpha), (0, 0, bw, bh), width=1, border_radius=6
    )
    badge.blit(text_surf, (padding_x, padding_y))

    screen.blit(badge, (pos_x, pos_y))
    return pygame.Rect(pos_x, pos_y, bw, bh)


def create_sharp_dot(color, size):
    surf = pygame.Surface((size, size), pygame.SRCALPHA)
    pygame.draw.rect(surf, color, (0, 0, size, size))
    return surf


def create_glow_particle(color, size):
    surf = pygame.Surface((size, size), pygame.SRCALPHA)
    center = size // 2
    pygame.draw.circle(surf, (*color, 80), (center, center), center)
    pygame.draw.circle(surf, (*color, 255), (center, center), max(1, center // 2))
    return surf


def create_flower_sprite(base_color, size=12):
    surf = pygame.Surface((size, size), pygame.SRCALPHA)
    center = size // 2
    petal_radius = max(2, size // 3)

    for angle in range(0, 360, 45):
        rad = math.radians(angle)
        px = center + int(math.cos(rad) * (size / 3.5))
        py = center + int(math.sin(rad) * (size / 3.5))
        pygame.draw.circle(surf, base_color, (int(px), int(py)), petal_radius)

    pygame.draw.circle(surf, (255, 215, 0), (center, center), max(2, petal_radius - 1))
    pygame.draw.circle(surf, (255, 100, 0), (center, center), max(1, petal_radius - 2))
    return surf


def create_glossy_pastel_aura(w, h):
    surf = pygame.Surface((w, h), pygame.SRCALPHA)
    cx, cy = w // 2, int(h * 0.45)
    max_r = int(math.hypot(cx, cy))

    for r in range(max_r, 0, -5):
        factor = r / max_r
        alpha = int(180 * (1 - factor) ** 1.5)
        pygame.draw.circle(surf, (255, 240, 200, alpha), (cx, cy), r)
    return surf


def analyze_image_and_targets(image_path, screen_w, screen_h):
    img = cv2.imread(image_path, cv2.IMREAD_COLOR)
    if img is None:
        print(
            f"Error: Could not find {image_path}. Please ensure image.png is in the directory."
        )
        sys.exit()

    new_w, new_h = screen_w, screen_h
    offset_x, offset_y = 0, 0

    img_smooth = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
    gray = cv2.cvtColor(img_smooth, cv2.COLOR_BGR2GRAY)

    blurred = cv2.bilateralFilter(gray, 5, 50, 50)
    edges = cv2.Canny(blurred, 50, 150)

    outline_targets = []
    for y in range(new_h):
        for x in range(new_w):
            if edges[y, x] > 0:
                outline_targets.append({"x": x + offset_x, "y": y + offset_y})

    flame_ratios = [
        (0.244, 0.548),
        (0.287, 0.525),
        (0.332, 0.548),
        (0.668, 0.548),
        (0.713, 0.525),
        (0.756, 0.548),
    ]
    flame_centers = []
    for rx, ry in flame_ratios:
        flame_centers.append(
            {"x": int(new_w * rx) + offset_x, "y": int(new_h * ry) + offset_y}
        )

    rgb_img = cv2.cvtColor(img_smooth, cv2.COLOR_BGR2RGB)
    surface_temp = pygame.image.frombuffer(rgb_img.tobytes(), (new_w, new_h), "RGB")
    reveal_color_surface = pygame.Surface((screen_w, screen_h))
    reveal_color_surface.blit(surface_temp, (offset_x, offset_y))

    reveal_targets = []
    TILE_SIZE = 2
    for y in range(0, new_h, TILE_SIZE):
        for x in range(0, new_w, TILE_SIZE):
            reveal_targets.append({"x": x + offset_x, "y": y + offset_y})

    # Sort targets based on 'y' ascending so the highest Y (bottom of image)
    # is at the end of the list. `.pop()` will grab these bottom targets first.
    outline_targets.sort(key=lambda t: t["y"])
    reveal_targets.sort(key=lambda t: t["y"])

    return outline_targets, reveal_targets, reveal_color_surface, flame_centers


def main():
    global WIDTH, HEIGHT
    print_author_banner()
    pygame.init()

    os.environ["SDL_VIDEO_WINDOW_POS"] = "0,35"

    info = pygame.display.Info()
    WIDTH = info.current_w
    HEIGHT = info.current_h - 130

    screen = pygame.display.set_mode((WIDTH, HEIGHT), pygame.NOFRAME)
    pygame.display.set_caption("Ganesha Visualizer - by Wastav Nagture")
    clock = pygame.time.Clock()

    font_title = pygame.font.SysFont("segoeui", 22, bold=True)
    font_body = pygame.font.SysFont("segoeui", 16, bold=True)
    font_sub = pygame.font.SysFont("segoeui", 13)
    font_watermark = pygame.font.SysFont("segoeui", 12)

    show_modal = False
    watermark_rect = None
    is_muted = False

    if os.path.exists(AUDIO_PATH):
        try:
            pygame.mixer.init()
            pygame.mixer.music.load(AUDIO_PATH)
            pygame.mixer.music.set_volume(0.85)
            pygame.mixer.music.play(-1)
        except (pygame.error, OSError) as err:
            print(f"Audio notice: {err}")

    targets = analyze_image_and_targets(IMAGE_PATH, WIDTH, HEIGHT)
    outline_targets, reveal_targets, reveal_color_surface, flame_centers = targets

    pastel_aura = create_glossy_pastel_aura(WIDTH, HEIGHT)

    outline_surface = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
    fill_surface = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)

    spr_outline_gold = create_sharp_dot((255, 215, 0), 1)

    bg_flower_sprites = [
        create_flower_sprite((255, 20, 147), 12),
        create_flower_sprite((0, 220, 120), 12),
        create_flower_sprite((65, 130, 255), 12),
        create_flower_sprite((255, 215, 0), 12),
    ]

    bg_glitter_sprites = [
        create_glow_particle((255, 215, 0), 4),
        create_glow_particle((255, 255, 255), 3),
    ]

    TILE_SIZE = 2
    active_particles = []
    bg_particles = []
    running = True
    phase = 1

    while running:
        screen.fill((5, 2, 5))

        current_time = pygame.time.get_ticks()
        mouse_pos = pygame.mouse.get_pos()
        is_hovered = watermark_rect.collidepoint(mouse_pos) if watermark_rect else False

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                if show_modal:
                    show_modal = False
                elif is_hovered:
                    show_modal = True
            elif event.type == pygame.KEYDOWN:
                if event.key in (pygame.K_c, pygame.K_i, pygame.K_h, pygame.K_F1):
                    show_modal = not show_modal
                elif event.key == pygame.K_m:
                    is_muted = not is_muted
                    if pygame.mixer.get_init():
                        if is_muted:
                            pygame.mixer.music.pause()
                        else:
                            pygame.mixer.music.unpause()
                elif event.key == pygame.K_ESCAPE:
                    if show_modal:
                        show_modal = False
                    else:
                        running = False

        if phase == 1:
            hue = (current_time // 20) % 360
            pastel_color = pygame.Color(0)
            pastel_color.hsva = (hue, 25, 95, 100)
            colored_aura = pastel_aura.copy()
            colored_aura.fill(pastel_color, special_flags=pygame.BLEND_RGBA_MULT)
            screen.blit(colored_aura, (0, 0))

        if phase < 3:
            screen.blit(outline_surface, (0, 0))

        screen.blit(fill_surface, (0, 0))

        # --- Phase 1: Gold Outline particles (fall → floor → rise to target) ---
        if phase == 1:
            if len(active_particles) < 4000:
                spawn_count = min(3000, len(outline_targets))
                for _ in range(spawn_count):
                    t = outline_targets.pop()
                    active_particles.append(
                        {
                            "type": "outline",
                            "sprite": spr_outline_gold,
                            "x": t["x"],
                            "y": random.randint(-80, -10),
                            "target_x": t["x"],
                            "target_y": t["y"],
                            "speed": random.uniform(15.0, 27.0),
                            "state": "falling",
                        }
                    )
            if not outline_targets and len(active_particles) == 0:
                phase = 2

        # --- Phase 2: Color tile particles (fall → floor → rise to target) ---
        elif phase == 2:
            if len(active_particles) < 4000:
                spawn_count = min(3000, len(reveal_targets))
                for _ in range(spawn_count):
                    t = reveal_targets.pop()
                    active_particles.append(
                        {
                            "type": "tile",
                            "x": t["x"],
                            "y": random.randint(-80, -10),
                            "target_x": t["x"],
                            "target_y": t["y"],
                            "speed": random.uniform(15.0, 27.0),
                            "state": "falling",
                        }
                    )
            if not reveal_targets and len(active_particles) == 0:
                phase = 3

        # --- Particle update: fall to floor, then rise to target ---
        surviving_particles = []
        for p in active_particles:
            if p["state"] == "falling":
                p["y"] += p["speed"] * 2.5
                if p["y"] >= HEIGHT:
                    p["y"] = HEIGHT
                    p["state"] = "rising"

                # Render during fall
                if p["type"] == "tile":
                    rect = (p["target_x"], p["target_y"], TILE_SIZE, TILE_SIZE)
                    screen.blit(reveal_color_surface, (p["x"], int(p["y"])), rect)
                elif p["type"] == "outline":
                    sprite_rect = p["sprite"].get_rect(center=(p["target_x"], int(p["y"])))
                    screen.blit(p["sprite"], sprite_rect)
                surviving_particles.append(p)

            elif p["state"] == "rising":
                p["y"] -= p["speed"]
                if p["y"] <= p["target_y"]:
                    # Reached target — paint permanently
                    if p["type"] == "tile":
                        rect = (p["target_x"], p["target_y"], TILE_SIZE, TILE_SIZE)
                        fill_surface.blit(reveal_color_surface, (p["target_x"], p["target_y"]), rect)
                    elif p["type"] == "outline":
                        target_rect = p["sprite"].get_rect(center=(p["target_x"], p["target_y"]))
                        outline_surface.blit(p["sprite"], target_rect)
                else:
                    # Still rising — render in motion
                    if p["type"] == "tile":
                        rect = (p["target_x"], p["target_y"], TILE_SIZE, TILE_SIZE)
                        screen.blit(reveal_color_surface, (p["x"], int(p["y"])), rect)
                    elif p["type"] == "outline":
                        sprite_rect = p["sprite"].get_rect(center=(p["target_x"], int(p["y"])))
                        screen.blit(p["sprite"], sprite_rect)
                    surviving_particles.append(p)

        active_particles = surviving_particles

        if phase >= 3:
            for i, center in enumerate(flame_centers):
                pulse = math.sin(current_time * 0.009 + i)
                radius = int(10 + pulse * 4)
                alpha = int(140 + pulse * 60)

                glow_surf = pygame.Surface((radius * 4, radius * 4), pygame.SRCALPHA)
                c_pt = radius * 2

                pygame.draw.circle(
                    glow_surf, (255, 255, 200, alpha), (c_pt, c_pt), int(radius * 0.4)
                )
                pygame.draw.circle(
                    glow_surf,
                    (255, 180, 50, int(alpha * 0.6)),
                    (c_pt, c_pt),
                    int(radius * 0.8),
                )
                pygame.draw.circle(
                    glow_surf, (255, 80, 0, int(alpha * 0.2)), (c_pt, c_pt), radius
                )

                shake_x = center["x"] + random.uniform(-0.5, 0.5)
                shake_y = center["y"] + random.uniform(-0.5, 0.5)

                rect = glow_surf.get_rect(center=(shake_x, shake_y))
                screen.blit(glow_surf, rect, special_flags=pygame.BLEND_RGBA_ADD)

        if phase >= 2 and random.random() < 0.08:
            is_flower = random.random() < 0.50
            if is_flower:
                sprite = random.choice(bg_flower_sprites)
                speed_y = random.uniform(1.8, 3.75)
                wobble_width = random.uniform(0.8, 1.8)
            else:
                sprite = random.choice(bg_glitter_sprites)
                speed_y = random.uniform(1.5, 5.25)
                wobble_width = random.uniform(0.1, 0.4)

            bg_particles.append(
                {
                    "sprite": sprite,
                    "x": random.randint(0, WIDTH),
                    "y": random.randint(-50, -10),
                    "speed_y": speed_y,
                    "wobble_speed": random.uniform(0.003, 0.0075),
                    "wobble_offset": random.uniform(0, math.pi * 2),
                    "wobble_width": wobble_width,
                }
            )

        surviving_bg = []
        for p in bg_particles:
            p["y"] += p["speed_y"]
            draw_x = (
                p["x"]
                + math.sin(current_time * p["wobble_speed"] + p["wobble_offset"])
                * p["wobble_width"]
                * 20
            )

            if p["y"] < HEIGHT:
                screen.blit(p["sprite"], (int(draw_x), int(p["y"])))
                surviving_bg.append(p)
        bg_particles = surviving_bg

        if not show_modal:
            watermark_rect = draw_credits(
                screen, WIDTH, HEIGHT, font_watermark, is_hovered, is_muted
            )
        else:
            draw_secret_modal(screen, WIDTH, HEIGHT, font_title, font_body, font_sub)

        pygame.display.flip()
        clock.tick(FPS)

    pygame.quit()
    sys.exit()


if __name__ == "__main__":
    main()
