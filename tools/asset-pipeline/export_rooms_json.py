#!/usr/bin/env python3
"""Export all TypeScript room data to public/rooms/*.json via Node.js eval."""
import json, subprocess, os, sys

OUTDIR = os.path.join(os.path.dirname(__file__), '../../monkey-island-web/public/rooms')
os.makedirs(OUTDIR, exist_ok=True)

# We can't easily import TypeScript, so define rooms inline from the TS data
# These mirror src/data/rooms.ts exactly.

rooms = {
  "tavern": {
    "id": "tavern",
    "name": "선술집 (스컵 바)",
    "walkArea": {"x1": 0.05, "y1": 0.55, "x2": 0.95, "y2": 0.88},
    "objects": [
      {"id":"mug","name":"맥주잔","x":0.7,"y":0.52,"w":14,"h":16,
       "item":{"id":"mug","name":"맥주잔","icon":"🍺"},
       "actions":{"look":"거품이 넘치는 그로그 맥주잔이다.","pick_up":"맥주잔을 집어들었다!","use":"벌컥벌컥... 독한 맛이다! 하지만 기분이 좋아졌다."}},
      {"id":"map","name":"보물 지도","x":0.42,"y":0.18,"w":50,"h":40,
       "actions":{"look":"벽에 걸린 보물 지도다. 'X' 표시가 선명하다.","read":"'원숭이 섬'이라고 적혀 있다. 보물이 묻힌 곳인가...","pick_up":"벽에 못으로 고정되어 있다. 떼어낼 수 없다."}},
      {"id":"bottles","name":"술병들","x":0.78,"y":0.2,"w":120,"h":50,
       "actions":{"look":"온갖 종류의 럼주와 그로그가 진열되어 있다.","pick_up":"바텐더가 노려본다. 함부로 가져갈 수 없다.","use":"손님한테 직접 따라드리진 않습니다, 해적 양반."}},
      {"id":"wanted_poster","name":"수배 전단","x":0.15,"y":0.22,"w":40,"h":50,
       "actions":{"look":"르척의 수배 전단이다. \"유령 해적 르척 - 현상금: 측정 불가\"라고 적혀있다.","read":"\"경고: 이 유령 해적은 극도로 위험합니다. 발견 즉시 도망치십시오.\"","pick_up":"벽에 단단히 붙어있다."}}
    ],
    "exits": [
      {"id":"harbor_door","name":"항구","to":"harbor","x":0.0,"y":0.4,"w":30,"h":130,"walkTo":{"x":0.05,"y":0.75}},
      {"id":"village_road_door","name":"마을 거리","to":"village_road","x":0.83,"y":0.35,"w":45,"h":130,"walkTo":{"x":0.88,"y":0.75}}
    ],
    "npcs": [
      {"id":"bartender","name":"바텐더","x":0.72,"y":0.58,"sprite":"bartender","dialogue":"bartender",
       "actions":{"look":"강인해 보이는 바텐더가 잔을 닦고 있다.","talk":""}}
    ]
  },
  "forest": {
    "id": "forest",
    "name": "깊은 숲",
    "walkArea": {"x1": 0.05, "y1": 0.6, "x2": 0.95, "y2": 0.92},
    "objects": [
      {"id":"mushroom_glow","name":"빛나는 버섯","x":0.18,"y":0.76,"w":14,"h":16,
       "item":{"id":"glowing_mushroom","name":"빛나는 버섯","icon":"🍄"},
       "actions":{"look":"보라색으로 빛나는 신비한 버섯이다.","pick_up":"조심스럽게 버섯을 뽑았다. 이상한 가루가 손에 묻었다.","use":"이걸 어디에 쓸 수 있을까..."}},
      {"id":"stone_idol","name":"돌 우상","x":0.5,"y":0.62,"w":30,"h":40,
       "actions":{"look":"고대 원주민이 만든 것 같은 돌 우상이다. 빨간 눈이 번뜩인다.","read":"\"동굴의 물 아래 열쇠가 잠든다\" 라고 쓰여있다.","push":"우상이 조금 움직였다! 뒤에서 먼지가 일어났다.","pull":"너무 무겁다. 꿈쩍도 안 한다."}},
      {"id":"wooden_bridge","name":"나무 다리","x":0.65,"y":0.7,"w":80,"h":14,
       "actions":{"look":"낡은 나무 다리다. 밧줄로 겨우 지탱하고 있다.","use":"조심스럽게 건넌다... 삐걱삐걱!","push":"다리가 흔들린다! 위험해!"}}
    ],
    "exits": [
      {"id":"harbor_back","name":"항구로 돌아가기","to":"harbor","x":0.0,"y":0.6,"w":30,"h":130,"walkTo":{"x":0.05,"y":0.75}},
      {"id":"beach_path","name":"해변으로 가는 길","to":"beach","x":0.92,"y":0.6,"w":40,"h":130,"walkTo":{"x":0.9,"y":0.75}},
      {"id":"sword_master_path","name":"검술 훈련장","to":"sword_master_area","x":0.82,"y":0.58,"w":40,"h":100,"walkTo":{"x":0.82,"y":0.72}}
    ],
    "npcs": [
      {"id":"voodoo_lady","name":"부두교 여사제","x":0.45,"y":0.78,"sprite":"voodoo_lady","dialogue":"voodoo_lady",
       "actions":{"look":"신비로운 분위기를 풍기는 부두교 여사제가 서 있다.","talk":""}}
    ]
  },
  "beach": {
    "id": "beach",
    "name": "달빛 해변",
    "walkArea": {"x1": 0.03, "y1": 0.62, "x2": 0.97, "y2": 0.92},
    "objects": [
      {"id":"palm_tree","name":"야자나무","x":0.32,"y":0.1,"w":20,"h":220,
       "actions":{"look":"높은 야자나무다. 위에 코코넛이 매달려 있다.","push":"나무를 흔들었더니... 코코넛이 떨어졌다!","pick_up":"나무는 집을 수 없다."}},
      {"id":"skull_rock","name":"해골 바위","x":0.7,"y":0.4,"w":70,"h":60,
       "actions":{"look":"해골 모양의 거대한 바위다. 눈구멍이 으스스하다.","use":"바위에 손을 대자 차가운 기운이 느껴진다...","push":"꿈쩍도 안 한다."}},
      {"id":"campfire","name":"모닥불","x":0.48,"y":0.75,"w":26,"h":16,
       "actions":{"look":"최근에 누군가 피운 것 같은 모닥불이다.","use":"불에 손을 대면 안 된다!","open":"재를 뒤적여보니... 탄 쪽지 조각이 나왔다."}},
      {"id":"old_chest","name":"오래된 상자","x":0.22,"y":0.7,"w":36,"h":24,
       "actions":{"look":"자물쇠가 채워진 오래된 보물 상자다.","open":"자물쇠가 잠겨있다. 열쇠가 필요해!","use":"열쇠가 없으면 열 수 없다.","pick_up":"상자가 땅에 반쯤 묻혀있다.",
         "cave_key":[{"cmd":"say","text":"녹슨 열쇠를 자물쇠에 꽂았다... 딸깍! 상자가 열렸다!"},{"cmd":"give_item","id":"treasure_map","name":"보물 지도 조각","icon":"🗺"},{"cmd":"set_flag","flag":"chest_opened","value":True},{"cmd":"hide_object","id":"old_chest"}]}},
      {"id":"x_marks_spot","name":"X 표시가 된 모래","x":0.54,"y":0.79,"w":30,"h":20,
       "actions":{"look":[{"cmd":"if","flag":"has_treasure_map","then":[{"cmd":"say","text":"지도에 표시된 위치다! 여기를 파야 한다. 삽이 필요해."}],"else":[{"cmd":"say","text":"모래사장의 한 부분처럼 보인다."}]}],"use":"삽이 있다면 파볼 수 있을 것 같다.",
         "shovel":[{"cmd":"if","flag":"has_treasure_map","then":[{"cmd":"say","text":"지도가 표시한 자리를 삽으로 팠다! 무언가 단단한 것이 닿는다..."},{"cmd":"give_item","id":"golden_idol","name":"황금 우상","icon":"🏺"},{"cmd":"set_flag","flag":"trial2_complete","value":True}],"else":[{"cmd":"say","text":"그냥 모래사장이다. 뭔가 이 자리에 있다는 단서가 필요해."}]}]}}
    ],
    "exits": [
      {"id":"forest_back","name":"숲으로 돌아가기","to":"forest","x":0.92,"y":0.6,"w":40,"h":130,"walkTo":{"x":0.9,"y":0.75}},
      {"id":"cave_entrance","name":"동굴 입구","to":"cave","x":0.05,"y":0.35,"w":60,"h":100,"walkTo":{"x":0.08,"y":0.65}}
    ]
  },
  "cave": {
    "id": "cave",
    "name": "수정 동굴",
    "walkArea": {"x1": 0.1, "y1": 0.55, "x2": 0.9, "y2": 0.9},
    "objects": [
      {"id":"crystal_shard","name":"수정 파편","x":0.72,"y":0.4,"w":20,"h":24,
       "item":{"id":"crystal_shard","name":"수정 파편","icon":"💎"},
       "actions":{"look":"아름답게 빛나는 수정이다.","pick_up":"조심스럽게 수정 파편을 꺼냈다!","use":"수정에서 이상한 에너지가 느껴진다..."}},
      {"id":"cave_key","name":"녹슨 열쇠","x":0.48,"y":0.76,"w":12,"h":10,
       "item":{"id":"cave_key","name":"녹슨 열쇠","icon":"🗝"},
       "actions":{"look":"물 아래 뭔가 반짝이는 것이 보인다... 열쇠다!","pick_up":"물에 손을 넣어 녹슨 열쇠를 건졌다!","use":"이 열쇠로 뭘 열 수 있을까..."}},
      {"id":"underground_pool","name":"지하 웅덩이","x":0.35,"y":0.72,"w":180,"h":50,
       "actions":{"look":"맑고 차가운 지하수가 고여 있다.","use":"물이 너무 차갑다! 손이 얼 것 같다."}}
    ],
    "exits": [
      {"id":"beach_back","name":"해변으로 돌아가기","to":"beach","x":0.3,"y":0.15,"w":260,"h":120,"walkTo":{"x":0.5,"y":0.55}}
    ]
  },
  "village_road": {
    "id": "village_road",
    "name": "마을 거리",
    "walkArea": {"x1": 0.1, "y1": 0.55, "x2": 0.9, "y2": 0.9},
    "objects": [
      {"id":"notice_board","name":"공고판","x":0.4,"y":0.35,"w":80,"h":55,
       "actions":{"look":"마을 공고판이다. 해적 시련에 관한 공지가 붙어있다.","read":"\"멜레 섬 해적단 가입 조건: 1) 검술 마스터와 결투 승리, 2) 총독 관저의 우상 반환, 3) 고대 보물 발굴. 세 가지 시련을 모두 완수한 자만 진정한 해적으로 인정받는다.\""}}
    ],
    "exits": [
      {"id":"to_tavern","name":"선술집으로","to":"tavern","x":0.0,"y":0.5,"w":30,"h":150,"walkTo":{"x":0.05,"y":0.75}},
      {"id":"to_mansion","name":"총독 관저","to":"governor_mansion","x":0.35,"y":0.0,"w":480,"h":110,"walkTo":{"x":0.5,"y":0.55}},
      {"id":"to_stan","name":"스탠의 배 가게","to":"stan_shop","x":0.88,"y":0.5,"w":50,"h":150,"walkTo":{"x":0.85,"y":0.75}},
      {"id":"to_prison","name":"감옥","to":"prison","x":0.25,"y":0.42,"w":50,"h":90,"walkTo":{"x":0.3,"y":0.7}}
    ],
    "npcs": [
      {"id":"sheriff","name":"보안관","x":0.6,"y":0.72,"sprite":"sheriff","dialogue":"sheriff",
       "actions":{"look":"팔짱을 끼고 거리를 순찰하는 보안관이다.","talk":""}}
    ]
  },
  "governor_mansion": {
    "id": "governor_mansion",
    "name": "총독 관저",
    "walkArea": {"x1": 0.05, "y1": 0.58, "x2": 0.95, "y2": 0.9},
    "objects": [
      {"id":"mansion_door","name":"관저 정문","x":0.44,"y":0.44,"w":60,"h":120,
       "actions":{"look":"화려하게 장식된 관저의 정문이다.","open":"경비가 막아선다. \"총독님은 방문객을 받지 않습니다!\"","use":"경비가 막아선다. \"비켜라!\"","knock":"경비가 문을 두드리지 말라고 경고한다."}},
      {"id":"mansion_window","name":"2층 창문","x":0.28,"y":0.15,"w":30,"h":28,
       "actions":{"look":"2층 창문이 살짝 열려 있는 것 같다. 밧줄이 있으면 올라갈 수 있을 것 같다.","use":"밧줄 없이는 올라갈 수 없다.",
         "rope":[{"cmd":"say","text":"밧줄을 창문 틀에 걸었다! 조심스럽게 올라간다..."},{"cmd":"set_flag","flag":"entered_mansion","value":True},{"cmd":"change_room","room":"mansion_interior","entryX":0.5}]}},
      {"id":"garden_hedge","name":"정원 울타리","x":0.05,"y":0.62,"w":110,"h":100,
       "actions":{"look":"잘 다듬어진 정원 울타리다.","push":"빽빽해서 통과할 수 없다.","use":"울타리를 뛰어넘는 건 힘들 것 같다."}},
      {"id":"fountain","name":"분수대","x":0.42,"y":0.62,"w":70,"h":60,
       "actions":{"look":"아름다운 분수대다.","use":"시원한 물에 얼굴을 씻었다.","pick_up":"분수대를 가져갈 수 없다."}}
    ],
    "exits": [
      {"id":"back_to_village","name":"마을로 돌아가기","to":"village_road","x":0.0,"y":0.55,"w":30,"h":150,"walkTo":{"x":0.05,"y":0.75}}
    ],
    "npcs": [
      {"id":"mansion_guard","name":"관저 경비","x":0.38,"y":0.65,"sprite":"mansion_guard","dialogue":"mansion_guard",
       "actions":{"look":"창을 들고 관저 앞을 지키는 경비다.","talk":""}}
    ]
  },
  "mansion_interior": {
    "id": "mansion_interior",
    "name": "총독 관저 내부",
    "walkArea": {"x1": 0.05, "y1": 0.55, "x2": 0.95, "y2": 0.9},
    "objects": [
      {"id":"governors_idol","name":"총독의 우상","x":0.46,"y":0.42,"w":50,"h":70,
       "actions":{"look":"황금빛으로 빛나는 귀중한 우상이다! 해적 시련의 목표물이다.",
         "pick_up":[{"cmd":"if","flag":"idol_taken","then":[{"cmd":"say","text":"이미 가져왔다."}],"else":[{"cmd":"give_item","id":"idol","name":"총독의 우상","icon":"🗿"},{"cmd":"set_flag","flag":"idol_taken","value":True},{"cmd":"set_flag","flag":"trial2_complete","value":True},{"cmd":"say","text":"우상을 조심스럽게 들어올렸다! 경보가 울리기 전에 빨리 나가야 한다!"}]}],
         "use":"이걸 가져가야 한다!"}},
      {"id":"trophy_case","name":"트로피 케이스","x":0.02,"y":0.1,"w":80,"h":200,
       "actions":{"look":"여러 가지 트로피와 항해 기념품이 가득하다.","open":"잠겨있다.","use":"잠겨있어서 열 수 없다."}},
      {"id":"governor_portrait","name":"총독의 초상화","x":0.78,"y":0.05,"w":140,"h":180,
       "actions":{"look":"총독 마리 초상화다. 영리하고 강인한 눈빛이다.","use":"그림을 건드리면 안 된다."}},
      {"id":"exit_window","name":"탈출 창문","x":0.88,"y":0.12,"w":60,"h":80,
       "actions":{"look":"탈출할 수 있는 창문이다.","use":"창문을 통해 밖으로 나간다!",
         "open":[{"cmd":"say","text":"창문을 열고 밖으로 뛰어내렸다!"},{"cmd":"change_room","room":"governor_mansion","entryX":0.5}]}}
    ],
    "exits": [
      {"id":"window_escape","name":"창문으로 탈출","to":"governor_mansion","x":0.88,"y":0.1,"w":60,"h":90,"walkTo":{"x":0.5,"y":0.75}}
    ]
  },
  "stan_shop": {
    "id": "stan_shop",
    "name": "스탠의 배 가게",
    "walkArea": {"x1": 0.02, "y1": 0.55, "x2": 0.98, "y2": 0.9},
    "objects": [
      {"id":"small_ship","name":"소형 범선","x":0.08,"y":0.3,"w":90,"h":60,
       "actions":{"look":"작은 범선이다. 5,000 피스 오브 에이트 가격표가 붙어있다.","use":"이 배를 사려면 스탠과 이야기해야 한다."}},
      {"id":"medium_ship","name":"중형 갈레온","x":0.38,"y":0.25,"w":130,"h":70,
       "actions":{"look":"중형 갈레온 전함이다. 10,000 피스 오브 에이트. 원숭이 섬까지 충분히 갈 수 있을 것 같다.","use":"이 배를 사려면 스탠과 이야기해야 한다."}},
      {"id":"large_ship","name":"대형 범선","x":0.65,"y":0.2,"w":160,"h":80,
       "actions":{"look":"거대한 대형 범선이다. 15,000 피스 오브 에이트.","use":"이 배를 사려면 스탠과 이야기해야 한다."}},
      {"id":"shovel","name":"삽","x":0.04,"y":0.5,"w":18,"h":60,
       "item":{"id":"shovel","name":"삽","icon":"⛏"},
       "actions":{"look":"오래된 삽이다. 뭔가를 파는 데 쓸 수 있을 것 같다.",
         "pick_up":[{"cmd":"if","flag":"trials_complete","then":[{"cmd":"say","text":"스탠이 웃으며 삽을 건네준다. \"해적 수료증 소지자 특별 서비스!\""},{"cmd":"give_item","id":"shovel","name":"삽","icon":"⛏"}],"else":[{"cmd":"say","text":"\"이건 구매 고객만 만질 수 있어요!\" 스탠이 막아선다."}]}]}},
      {"id":"discount_sign","name":"할인 간판","x":0.6,"y":0.55,"w":90,"h":30,
       "actions":{"look":"\"해적 수료증 소지자 50% 할인!\" 세 가지 시련을 완수하면 배를 싸게 살 수 있다.","read":"\"세 가지 시련을 완수한 자에게 특별 혜택을 드립니다!\""}}
    ],
    "exits": [
      {"id":"back_to_village_from_stan","name":"마을로 돌아가기","to":"village_road","x":0.0,"y":0.5,"w":30,"h":150,"walkTo":{"x":0.05,"y":0.75}}
    ],
    "npcs": [
      {"id":"stan","name":"스탠","x":0.85,"y":0.6,"sprite":"stan","dialogue":"stan",
       "actions":{"look":"줄무늬 재킷을 입고 활짝 웃고 있는 스탠이다.","talk":""}}
    ]
  },
  "sword_master_area": {
    "id": "sword_master_area",
    "name": "검술 훈련장",
    "walkArea": {"x1": 0.05, "y1": 0.58, "x2": 0.95, "y2": 0.92},
    "objects": [
      {"id":"training_dummy","name":"훈련용 허수아비","x":0.14,"y":0.42,"w":60,"h":80,
       "actions":{"look":"볏짚으로 만든 훈련용 허수아비다.","use":"허수아비를 향해 찌르고 베는 동작을 연습했다!","push":"허수아비가 흔들렸다!","pick_up":"이건 가져갈 수 없다."}},
      {"id":"sword_rack","name":"검 걸이","x":0.28,"y":0.38,"w":60,"h":80,
       "actions":{"look":"여러 자루의 훈련용 검이 걸려있다.","use":"훈련용 검을 잠깐 휘둘러 봤다.","pick_up":"칼라의 허락 없이 가져갈 수 없다."}},
      {"id":"crossed_swords","name":"교차 검 문양","x":0.38,"y":0.42,"w":60,"h":55,
       "actions":{"look":"\"진정한 검객은 검이 아닌 말로 싸운다\" 라고 새겨져 있다.","use":"검술 훈련장의 상징이다."}}
    ],
    "exits": [
      {"id":"back_to_forest","name":"숲으로 돌아가기","to":"forest","x":0.0,"y":0.55,"w":30,"h":150,"walkTo":{"x":0.05,"y":0.75}}
    ],
    "npcs": [
      {"id":"carla","name":"칼라 (검술 마스터)","x":0.65,"y":0.75,"sprite":"carla","dialogue":"carla",
       "actions":{"look":"강인한 눈빛의 칼라다. 멜레 섬 최강의 검술사로 알려져 있다.","talk":""}}
    ]
  },
  "prison": {
    "id": "prison",
    "name": "감옥",
    "walkArea": {"x1": 0.3, "y1": 0.55, "x2": 0.98, "y2": 0.92},
    "objects": [
      {"id":"cell_bars","name":"감옥 창살","x":0.04,"y":0.0,"w":380,"h":460,
       "actions":{"look":"두꺼운 쇠창살이다. 사람이 갇혀있다.","use":"창살을 잡아당겨봤지만 꿈쩍도 안 한다.","push":"창살이 꿈쩍도 안 한다."}},
      {"id":"hanging_keys","name":"열쇠꾸러미","x":0.84,"y":0.34,"w":20,"h":30,
       "actions":{"look":"보안관 책상 위에 열쇠꾸러미가 걸려 있다.",
         "pick_up":[{"cmd":"if","flag":"sheriff_distracted","then":[{"cmd":"give_item","id":"cell_keys","name":"감옥 열쇠","icon":"🔑"},{"cmd":"set_flag","flag":"has_cell_keys","value":True}],"else":[{"cmd":"say","text":"보안관이 보고 있다. 가져갈 수 없다."}]}]}},
      {"id":"sheriff_desk","name":"보안관 책상","x":0.7,"y":0.5,"w":200,"h":130,
       "actions":{"look":"보안관의 책상이다. 서류들이 어지럽게 쌓여있다.","use":"함부로 건드리면 안 될 것 같다.","open":"보안관이 노려본다."}}
    ],
    "exits": [
      {"id":"back_to_village_from_prison","name":"마을로 돌아가기","to":"village_road","x":0.88,"y":0.55,"w":50,"h":150,"walkTo":{"x":0.85,"y":0.75}}
    ],
    "npcs": [
      {"id":"otis","name":"오티스","x":0.22,"y":0.55,"sprite":"otis","dialogue":"otis",
       "actions":{"look":"창살 뒤에 갇혀있는 해적이다.","talk":""}}
    ]
  }
}

written = 0
for room_id, room_data in rooms.items():
    outpath = os.path.join(OUTDIR, f'{room_id}.json')
    if os.path.exists(outpath):
        print(f'  SKIP (exists): {room_id}.json')
        continue
    with open(outpath, 'w', encoding='utf-8') as f:
        json.dump(room_data, f, ensure_ascii=False, indent=2)
    print(f'  WRITE: {room_id}.json')
    written += 1

print(f'\nDone: {written} room JSON files written.')
