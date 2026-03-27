# 🏴‍☠️ The Secret of Monkey Island — 완전 아카이브
## 게임 복각을 위한 종합 설계 문서

---

# 1. 게임 개요

| 항목 | 내용 |
|------|------|
| **타이틀** | The Secret of Monkey Island |
| **개발사** | Lucasfilm Games (현 LucasArts) |
| **출시연도** | 1990 |
| **장르** | Point-and-Click Adventure |
| **엔진** | SCUMM (Script Creation Utility for Maniac Mansion) |
| **디자이너** | Ron Gilbert, Tim Schafer, Dave Grossman |
| **플랫폼** | PC (DOS), Amiga, Atari ST, Mac, SEGA CD / 2009 Special Edition (PC, Xbox 360, PS3, iOS) |

**핵심 컨셉:** 해적이 되고 싶은 순진한 청년 Guybrush Threepwood가 Mêlée Island에 도착하여 세 가지 시련을 통과하고, 유령 해적 LeChuck에게 납치된 총독 Elaine Marley를 구출하기 위해 전설의 Monkey Island로 떠나는 코미디 어드벤처.

**게임 철학 (Ron Gilbert):**
- 플레이어가 죽지 않는 어드벤처 (사실상 10분 물속 시간제한만 존재하며 이것도 이스터에그)
- 비선형 진행 (세 가지 시련을 어떤 순서로든 완료 가능)
- 퍼즐은 스토리의 일부여야 함
- 막히는 느낌을 최소화하는 설계

---

# 2. 인터페이스 & 조작 시스템

## 2.1 SCUMM 동사 시스템

화면 하단에 9개의 동사(Verb)가 표시되며, 이를 화면의 오브젝트와 조합하여 행동:

| 동사 | 단축키 | 설명 |
|------|--------|------|
| **Open** | O | 문, 서랍, 상자 등을 연다 |
| **Close** | C | 열린 것을 닫는다 |
| **Push** | S | 밀기 |
| **Pull** | Y | 당기기 |
| **Give** | G | NPC에게 아이템 전달 |
| **Pick Up** | P | 아이템 획득 |
| **Look At** | L | 오브젝트/인물 관찰 |
| **Talk To** | T | NPC와 대화 |
| **Use** | U | 아이템 사용 또는 아이템끼리 결합 |

## 2.2 인벤토리 시스템
- 화면 하단 동사 아래에 아이템 목록 표시
- 아이템을 동사와 결합하거나, 아이템끼리 결합 가능
- 예: "Use [꽃] with [고기]" → 수면제 고기 생성

## 2.3 대화 시스템
- 다지선다형 대화 트리
- 보통 3~5개의 선택지 제공
- 대부분의 대화 선택지는 스토리에 치명적 영향 없음 (코미디 목적)
- 일부 대화는 퍼즐 해결에 필수

---

# 3. 등장인물 상세 프로필

## 3.1 주요 인물

### 🗡️ Guybrush Threepwood (주인공)
- **역할:** 플레이어 캐릭터, 해적 지망생
- **외모:** 금발의 젊은 남성, 약간 어리숙한 인상
- **성격:** 선량하고 순진하며 서투르지만 강한 의지. 항상 엉뚱한 말을 엉뚱한 타이밍에 함. 유머 감각이 있고 자기비하적인 면도 있음
- **특기:** 10분간 숨 참기 (게임 내 유명한 설정)
- **동기:** 해적이 되는 것이 꿈. 이후 Elaine에 대한 사랑이 추가 동기
- **상징적 대사:** "I'm Guybrush Threepwood and I want to be a mighty pirate!"
- **관계:** Elaine에게 한눈에 반함, LeChuck의 영원한 적

### 👑 Elaine Marley (총독)
- **역할:** Mêlée Island의 총독, 히로인
- **외모:** 아름다운 젊은 여성, 붉은 머리
- **성격:** 강인하고 독립적이며 지적. 스스로 문제를 해결할 능력이 충분. 약간 도도하면서도 따뜻한 성격
- **동기:** 섬의 질서 유지, LeChuck의 구애 거부
- **특이사항:** 게임 끝에서 Guybrush의 구출이 불필요했다는 것이 밝혀짐 — 이미 자체적으로 탈출 계획 수행 중
- **상징적 장면:** Part 4에서 교회 천장에서 로프를 타고 내려오며 "이미 다 통제하고 있었어"라고 선언

### 💀 LeChuck (메인 빌런)
- **역할:** 유령 해적, 시리즈 전체의 대적
- **외모:** 푸른 빛의 유령 형태, 덥수룩한 턱수염, 위협적인 체구
- **성격:** 사악하고 집요하며 Elaine에게 병적으로 집착. 다른 해적들에게 공포의 대상
- **배경:** 생전에 Elaine에게 구애했으나 거절당함. Elaine이 "꺼져 죽어(drop dead)"라고 하자 실제로 죽음. Monkey Island 탐험 중 사망 후 유령 해적으로 부활
- **약점:** Root Beer(루트비어) — 유령을 소멸시키는 효과
- **전략:** Part 4에서 Elaine을 강제로 결혼시키려 함
- **부하:** 유령 해적들로 구성된 선원단, 1등 항해사 Bob

### 🔮 Voodoo Lady (부두 여사제)
- **역할:** 조언자, 부두 마법사
- **위치:** Mêlée Island 마을 내 부두 가게 (International House of Mojo)
- **외모:** 신비로운 분위기의 여성, 어두운 가게에서 활동
- **성격:** 신비롭고 지혜로움. 간접적인 힌트를 통해 Guybrush를 인도
- **역할 상세:** Guybrush에게 Monkey Island로 가려면 배, 선원, 지도가 필요하다고 알려줌. 부두 마법과 LeChuck에 대한 정보 제공
- **아이템:** 고무 닭(Rubber Chicken with a Pulley in the Middle) 보유 — 가게에서 획득 가능

### ⚔️ Carla (검술 마스터)
- **역할:** Mêlée Island의 Sword Master
- **위치:** 섬 숲 깊은 곳의 은신처
- **성격:** 엄격하고 자부심 강함. 실력 있는 검사
- **게임 내 기능:** "세 가지 시련" 중 검술 시련의 최종 보스. 모욕 검술(Insult Sword Fighting)으로 대결
- **이후:** Guybrush의 선원으로 합류. Part 4에서 Elaine 구출에 동행

### 🪝 Meathook
- **역할:** 은둔 해적, 선원 후보
- **위치:** Mêlée Island 북동쪽의 외딴 섬 (케이블로 연결)
- **외모:** 양 손이 갈고리. 거구
- **성격:** 겁이 많지만 이를 숨기려 함. 특히 앵무새를 무서워함 (앵무새가 그의 손을 먹었다고 주장)
- **가입 조건:** Guybrush가 "맹수"를 만지는 용기를 보여야 함 → 실제로는 앵무새를 터치하면 됨
- **코미디 요소:** 무시무시한 야수라 부른 것이 사실 귀여운 앵무새

### 🔒 Otis
- **역할:** 수감자, 선원 후보
- **위치:** Mêlée Island 감옥
- **성격:** 교활하고 기회주의적. 처음에는 Guybrush를 속이고 도주하지만 결국 선원으로 합류
- **해방 방법:** Grog(해적 술)으로 감옥 자물쇠를 녹여야 함 — Grog은 금속을 부식시키는 강력한 술
- **코미디 요소:** 석방 후 바로 속이고 달아남. "꽃 냄새를 맡았다"는 이유로 수감됨

### 🏪 Stan (중고선박상)
- **역할:** 중고 선박 판매상
- **위치:** Stan's Previously Owned Vessels (Mêlée Island 해안)
- **외모:** 화려한 체크무늬 재킷. 절대 멈추지 않는 팔 제스처
- **성격:** 전형적인 사기꾼 중고차 딜러의 해적 버전. 말이 매우 빠르고 압도적. 무엇이든 팔려고 함
- **게임 내 역할:** Sea Monkey 호를 외상(신용 증서)으로 판매
- **코미디 요소:** 끊임없는 팔 흔들기 애니메이션, 과장된 세일즈 화법
- **Part 4 역할:** 그의 가게에 있는 Grog 자판기가 최종전의 핵심 아이템 제공

### 🏝️ Herman Toothrot
- **역할:** Monkey Island의 난파선 표류자
- **외모:** 반바지만 입은 허름한 행색, 긴 머리와 수염
- **성격:** 오랜 고립으로 약간 정신이 나간 상태. 엉뚱하고 철학적인 발언을 함. 도움을 원하지만 직접적으로 유용한 정보를 거의 못 줌
- **배경:** 수년간 Monkey Island에 표류. 곳곳에 메모를 남김
- **게임 내 기능:** Monkey Island 곳곳에서 나타나 대화 가능. 특정 아이템(열쇠)을 보유

### 🧑‍🍳 Scumm Bar Cook (스컴바 요리사)
- **역할:** Scumm Bar의 요리사
- **게임 내 기능:** 주방에 들어가려면 요리사가 자리를 비울 때 진입해야 함
- **획득 아이템:** 냄비(Pot), 고기 덩이(Hunk of Meat)

### 👁️ Lookout (망루지기)
- **역할:** Mêlée Island 전망대의 노인
- **특징:** 반쯤 장님인 망루지기 — 시리즈의 첫 캐릭터이자 첫 유머 포인트
- **기능:** 게임 오프닝 대화, 배경 설명, LeChuck의 Elaine 납치 소식 전달

### 🏪 Storekeeper (잡화점 주인)
- **역할:** Mêlée Island 잡화점 운영
- **게임 내 기능:**
  - 검과 삽 판매
  - 신용 증서를 금고에 보관 (금고 비밀번호를 관찰해야 함)
  - Sword Master의 위치를 알려줌 (따라가야 위치 파악 가능)
  - 숨 민트(Breath Mints) 제공

### 🎪 Fettucini Brothers (서커스 형제)
- **역할:** 서커스단 형제, Alfredo와 Bill
- **위치:** Mêlée Island 공터(Clearing)의 서커스 텐트
- **게임 내 기능:** 대포에서 인간 발사 쇼에 Guybrush를 고용. 냄비를 헬멧으로 제공하면 478 pieces of eight를 벌 수 있음
- **코미디:** 누가 대포에 들어갈지 항상 싸우는 중

### 🗡️ Captain Smirk (검술 교관)
- **역할:** 검술 훈련소 운영자
- **위치:** Mêlée Island 동쪽 끝 집
- **게임 내 기능:** 30 pieces of eight를 받고 모욕 검술의 기초를 가르침. 훈련 장치(THE MACHINE)를 사용
- **교훈:** "검투는 칼이 아닌 혀로 이기는 것이다"

### 🌉 Troll (다리 지기)
- **역할:** 다리를 지키는 트롤
- **요구:** "관심을 끌지만 실제로는 중요하지 않은 것" → Red Herring(빨간 청어, 말장난) 제공
- **코미디:** 고전적 "빨간 청어(미끼)" 말장난의 문자 그대로의 구현

### 🦜 Citizen of Mêlée (앵무새 남자)
- **역할:** 마을의 수상한 시민
- **위치:** Low Street 코너
- **게임 내 기능:** 보물 지도 판매 (100 pieces of eight). "사촌 Sven이 있냐"고 물으면 "이발사 Dominique가 있다"고 대답해야 함

### 🧟 Bob (유령 선원)
- **역할:** LeChuck의 유령선 1등 항해사
- **성격:** 다른 유령들에 비해 상대적으로 친화적
- **Part 4 역할:** Monkey Island 지하에서 대화 상대

### 🎭 Pirate Leaders (해적 수뇌부)
- **역할:** Scumm Bar에서 활동하는 중요한 해적 3인
- **게임 내 기능:** "세 가지 시련"을 제시하고 완수 여부를 확인
- **시련 내용:** 검술, 보물찾기, 도둑질

### 🍖 Men of Low Moral Fiber (천한 해적들)
- **역할:** Low Street에서 어슬렁거리는 해적 3인조
- **기능:** 잡담, minutes(동전) 제공, 쥐 옆에 서 있음

### 👤 Estevan
- **역할:** Scumm Bar의 검은 옷 입은 해적
- **기능:** LeChuck과 Elaine의 배경 이야기 제공

### 🏴‍☠️ Mancomb Seepgood
- **역할:** Scumm Bar의 해적
- **기능:** 배경 정보 제공

### 👮 Sheriff Fester Shinetop
- **역할:** 보안관 (실은 LeChuck의 변장)
- **게임 내 기능:** 총독 저택 침입 시 Guybrush와 대치. Guybrush를 부두에서 물속으로 던짐 (Fabulous Idol과 함께)

### 🏝️ Monkey Island Cannibals (식인종 3인조)
- **이름:** Red Skull, Sharptooth, Lemonhead
- **외모:** 거대한 의례용 마스크 착용 (입이 움직이는 마스크)
- **성격:** 실제로는 채식주의 성향. 자기들 마을에 침입자를 감금하지만 폭력적이지 않음
- **코미디:** "뒤에 머리 세 개 달린 원숭이가 있다!" → 실제로 나타남
- **게임 내 역할:** Voodoo Root를 Ghost Pirate Spritzer로 가공해줌

### 🐒 Three-Headed Monkey (머리 셋 달린 원숭이)
- **역할:** 게임의 상징적인 running gag
- **기능:** Guybrush의 유명한 대사 "Look behind you! A three-headed monkey!"의 주인공

---

# 4. 게임 구조 — 4파트 시나리오

## Part 1: The Three Trials (세 가지 시련)

### 4.1.1 시작 — Mêlée Island 도착

**오프닝 장면:** Guybrush가 Mêlée Island 전망대에 도착. 망루지기(Lookout)와의 대화로 시작.

> "I'm Guybrush Threepwood and I want to be a mighty pirate!"

**진행 경로:** 전망대 → 절벽 내려감 → 부두 → Scumm Bar 입장

**Scumm Bar 내부:**
- 입구 근처 해적들과 대화 → Estevan에게 소개받음 → LeChuck/Elaine 배경 정보 획득
- 커튼 뒤 방으로 이동 → 해적 수뇌부(Important-Looking Pirates)와 대화
- 세 가지 시련 부여:
  1. **검술 시련:** Sword Master를 이겨라
  2. **보물 시련:** Mêlée Island의 전설의 보물을 찾아라
  3. **도둑질 시련:** 총독 저택에서 Idol을 훔쳐라

**주방 침입:**
- 요리사가 자리를 비울 때 진입
- 획득: 냄비(Pot), 고기 덩이(Hunk of Meat)
- 널빤지 위의 갈매기를 반복 밟기 → 물고기(Red Herring) 획득

### 4.1.2 시련 1: 검술 마스터리 (Sword Mastery)

**단계:**
1. 잡화점에서 칼(Sword) 구매
2. 다리의 트롤에게 Red Herring 제공 → 다리 통과
3. Captain Smirk 체육관에서 30 pieces of eight로 훈련
4. 모욕 검술(Insult Sword Fighting) 시스템 학습
5. 섬 지도에서 배회하는 해적들과 결투하여 모욕과 응수 학습
6. 잡화점 주인에게 Sword Master 위치 요청 → 주인을 미행하여 위치 파악
7. Sword Master Carla에게 도전 → 5회 승리 시 완료
8. 보상: 100% Cotton T-shirt

### 4.1.3 시련 2: 보물 찾기 (Treasure Hunting)

**준비물 구매:**
- 잡화점에서 삽(Shovel) 구매: 75 pieces of eight
- Citizen of Mêlée에게서 보물 지도 구매: 100 pieces of eight (이발사 Dominique 언급 필요)
- 돈벌기: 서커스 Fettucini Brothers의 인간대포 쇼 → 478 pieces of eight

**보물 찾기 과정:**
- 지도는 춤 스텝처럼 보이지만 실제로는 방향 지시
- 각 줄의 첫 단어가 화면 이동 방향: Back, Left, Right 등
- Fork에서 시작하여 9개의 방향 지시를 따름
- X 표시된 곳에서 삽으로 파기 → Lost Treasure of Mêlée Island 발견

**이벤트:** 보물 발견 직후, LeChuck의 유령선이 목격됨 → 망루지기가 달려와 Elaine 납치 소식 전달

### 4.1.4 시련 3: 도둑질 (Thievery)

**준비:**
- 포크에서 왼쪽 경로 → 노란 꽃(Yellow Petal) 획득
- 꽃을 고기와 결합 → 수면제 고기

**총독 저택 침입:**
- 저택 앞 피라냐 푸들에게 수면제 고기 제공 → 잠듦
- 저택 진입 → 문 열기 → 초현실적 시퀀스 발동
- Sheriff Shinetop과의 대치
- Guybrush가 의자로 보안관을 가두고 파일(file) 필요 표명
- 최종적으로 수중에 빠짐 (Fabulous Idol과 묶여서)

**수중 탈출:**
- 날카로운 것들이 있지만 닿지 않음
- 해결법: 바닥의 Fabulous Idol을 그냥 집으면 됨 (너무 무거워서 밧줄이 끊어짐)
- Idol을 해적 수뇌부에게 제출 → 시련 완료

---

### 4.1.5 배와 선원 구하기 (Finding a Ship and Crew)

**Elaine 납치 이후 진행:**

**부두 여사제 방문:**
- Monkey Island에 가려면 배, 선원, 방법이 필요하다는 정보 획득

**선원 모집:**

| 선원 | 위치 | 가입 방법 |
|------|------|----------|
| Carla | Sword Master의 은신처 | "총독이 납치됐다" 알리면 즉시 합류 |
| Meathook | 케이블로 연결된 외딴 섬 | 고무 닭으로 케이블 건넘 → "맹수" 터치 (앵무새) |
| Otis | 마을 감옥 | Grog으로 자물쇠 녹이기 (컵 간 이동 필수) |

**Grog 전달 퍼즐:**
- Grog은 금속을 부식시킴 → 머그컵도 녹임
- Scumm Bar에서 빈 머그컵 여러 개 수집
- Grog 자판기에서 Grog 획득 → 녹기 전에 새 컵으로 옮기며 감옥까지 이동
- 시간 제한 퍼즐 (컵이 완전히 녹기 전에 교체)

**배 구매:**
- Stan's Previously Owned Vessels 방문
- "비싼 건 못 산다" → Sea Monkey 소개
- "외상으로 사겠다" → 잡화점의 신용 증서 필요
- 잡화점 주인에게 신용 증서 요청 → 금고 열 때 비밀번호 관찰
- 주인이 자리 비운 사이 금고에서 신용 증서 획득
- Stan에게 돌아가 Sea Monkey 구매 (가격 흥정 가능)

---

## Part 2: The Journey (항해)

### 4.2.1 Sea Monkey 호 탐험

**선장실(Captain's Quarters):**
- 깃펜(Feather Pen)과 잉크(Ink) 획득
- 서랍 열기 → 먼지 쌓인 책(Dusty Book) 획득 및 읽기
- 캐비닛은 잠겨 있음 (나중에 열쇠 필요)

**갑판(Deck):**
- 선원들과 대화 (아무 일도 안 함)
- 돛대 위 줄사다리 올라가기 → Jolly Roger(해적기) 획득

**주방(Kitchen):**
- 냄비(Pot) 획득
- 벽장 열기 → 시리얼(Cereal) 획득
- 시리얼 열기 → 경품(Prize) 발견
- 경품 확인 → 원숭이 머리 모양 작은 열쇠(Small Key)

**창고(Storeroom):**
- 상자 열기 → 고급 와인(Fine Wine) 획득
- 거대한 밧줄 코일(Giant Piece of Rope) 획득
- 통 열기 → 화약(Gunpowder) 획득

**캐비닛 열기:**
- 작은 열쇠로 선장실 캐비닛 개봉
- 상자 열기 → 부두 레시피(Voodoo Recipe)와 시나몬 스틱(Cinnamon Sticks) 획득

### 4.2.2 부두 마법 주문

**레시피에 따라 큰 조리솥에 재료 투입:**

| 필수 재료 | 비고 |
|-----------|------|
| Cinnamon Sticks | 캐비닛에서 획득 |
| Breath Mints | 잡화점에서 획득 |
| Jolly Roger | 돛대에서 획득 |
| Ink | 선장실에서 획득 |
| Fine Wine | 창고에서 획득 |
| Chicken (고기) | Part 1에서 획득 |
| Cereal | 주방에서 획득 |
| Gunpowder | 창고에서 획득 (마지막에 투입) |

**결과:** 솥이 폭발하며 부두 주문 발동 → Guybrush 기절 → 눈을 뜨면 Monkey Island 근처

### 4.2.3 대포 발사 — Monkey Island 상륙

1. Mêlée Island 보물 지도를 조리솥 불에 사용 → 불꽃 덩어리(Flaming Mass) 획득
2. 창고에서 화약 추가 획득
3. 갑판으로 이동 → 대포 노즐에 화약 투입
4. 대포에 밧줄 연결 (도화선)
5. 냄비를 헬멧으로 착용
6. 불꽃으로 도화선 점화
7. 대포에서 발사 → Monkey Island 해변에 착륙!

---

## Part 3: Under Monkey Island (원숭이 섬 탐험)

### 4.3.1 Monkey Island 남쪽 해변

- 모래에서 머리 빼기
- 나무에 걸린 안내문 읽기
- 바나나(Banana) 획득
- 숲으로 진입 → 맵 모드

### 4.3.2 주요 장소 탐험

**Herman의 요새(Fort on Volcano):**
- 대포 밀기 → 포탄(Cannonball) 획득
- 화약(Gunpowder), 밧줄(Rope), 망원경(Spyglass) 획득
- Herman Toothrot 등장 → 대화 (직접적 도움은 미미)

**강 갈림길(River Fork):**
- 돌(Rock)과 메모(Note) 획득
- 다리 건너기 → 바위벽 올라가기

**연못(Pond):**
- 바위 시소 퍼즐 → 돌 투석기로 바나나 나무의 바나나 획득 (또는 Sea Monkey를 침몰시킬 수 있음 — 엔딩 분기)

**시체와 밧줄:**
- 연못 이후 → 통나무가 물에 떠 있고, 바닥의 시체에서 밧줄 획득

**틈새(Crack):**
- 바닥에 노(Oars)가 보임
- 첫 번째 밧줄을 튼튼한 나뭇가지에 묶기
- 두 번째 밧줄을 그루터기에 묶기
- 내려가서 노 획득

**바나나 나무 해변:**
- 바나나 추가 획득
- 노를 보트에 사용 → 해상 이동 가능

### 4.3.3 식인종 마을

- 거대한 원숭이 머리(Giant Monkey Head) 옆 마을
- 과일 그릇에서 바나나 추가 획득
- 마을 밖으로 나가려 하면 식인종 3인이 포획 → 게스트룸 감금
- **탈출:** 해골 아래 느슨한 널빤지 → 마을 외부로 탈출

### 4.3.4 원숭이 따라가기

- 숲에서 원숭이 발견
- 바나나 5개 모두 주기 → 원숭이가 따라옴
- 토템폴의 코를 당기면 울타리 개방 → 코에서 손 떼면 닫힘
- 원숭이가 코를 잡아당김 → Guybrush 통과
- Wimpy Little Idol 획득

### 4.3.5 식인종과의 교섭

1. 식인종에게 재포획됨 (탈출-재포획 반복 가능)
2. Wimpy Little Idol을 식인종에게 제공 → 신뢰 획득
3. 식인종에게 LeChuck의 유령선 정보 입수:
   - LeChuck이 반유령 물약의 핵심 재료(Voodoo Root)를 유령선에 보관
   - 유령선은 Giant Monkey Head 아래 숨겨져 있음
   - 미로 탐색에 항해사의 축소 머리(Navigator's Head) 필요
4. Stan의 브로슈어 "How to Get Ahead in Navigating"을 식인종에게 제공 → Navigator's Head 획득

### 4.3.6 Giant Monkey Head & 유령선

**거대 원숭이 머리 열기:**
- 원숭이 머리 옆 거대한 면봉(Giant Cotton Swab) → 바나나를 사용하면 원숭이가 귀에 면봉 삽입 → 입이 열림 (혀가 나옴)

**미로 탐색:**
- 원숭이 척추뼈 사다리를 타고 내려감
- 뒤틀린 통로 — 눈알, 코, 손, 거대한 심장이 벽에서 돌출
- Navigator's Head가 방향을 가리킴 → 지시에 따라 이동
- 유령 해적을 만나면 Root Beer(솥에서 만든 물약 아닌 일반 루트비어)로 제거

**LeChuck의 유령선:**
- 갑판 탐색 → 유령 선원들 회피
- 잠자는 유령의 깃털 간지럼 → 술병(Jug o' Grog) 획득
- 쥐 방에 Grog 부어 쥐 취하게 함 → 윤활유(Glob of Grease) 획득
- 삐걱거리는 문에 윤활유 사용
- 유령 도구(Ghost Tools) 획득
- 빛나는 상자를 도구로 열기 → Voodoo Root 획득

**귀환:**
- Voodoo Root을 식인종에게 제공 → Ghost Pirate Spritzer(반유령 분무기) 제작
- 유령선으로 돌아가려 하지만 → 선이 사라짐!
- Bob(1등 항해사)가 LeChuck이 Elaine과 결혼하러 Mêlée Island로 갔다고 알려줌
- 선원들(Carla, Meathook, Otis 또는 Herman) 도착 → Mêlée Island로 귀환

---

## Part 4: Guybrush Kicks Butt (최종결전)

### 4.4.1 Mêlée Island 귀환

- 부두에 도착 → 유령 해적 출현
- Ghost Pirate Spritzer로 유령 제거
- 마을을 지나 교회로 향함 (도중 유령들 처치)

### 4.4.2 교회 장면 — 결혼식 방해

- 교회 진입 → LeChuck과 "Elaine"의 결혼식 진행 중
- Guybrush가 결혼식을 방해하는 대화 선택 (어떤 것이든 가능)
- **반전:** Elaine이 천장에서 로프를 타고 내려옴! "이미 다 통제하고 있었어!"
- **추가 반전:** 신부는 진짜 Elaine이 아니라 드레스를 입은 원숭이 두 마리
- 원숭이들이 Ghost Pirate Spritzer를 들고 도주

### 4.4.3 LeChuck과의 최종전

- LeChuck이 분노하여 Guybrush를 주먹으로 날려버림
- Guybrush가 섬 곳곳으로 날아다님 (여러 장소 경유)
- **핵심:** Stan's Used Ship Emporium의 Grog 자판기에 충돌
- 자판기에서 Root Beer 병이 떨어짐
- **빠르게 Root Beer를 집어 LeChuck에게 사용!**
- (늦으면 다시 날려보내지지만 결국 다시 자판기로 돌아옴)

### 4.4.4 엔딩

- Root Beer로 LeChuck이 폭발 → 거대한 불꽃놀이
- Guybrush와 Elaine 단둘이 남음
- **분기 엔딩:**
  - Sea Monkey를 침몰시킨 경우 → Carla, Otis, Meathook가 식인종에게 잡혀있는 장면
  - Sea Monkey가 무사한 경우 → Herman Toothrot가 여전히 Monkey Island에 표류 중인 장면

---

# 5. 모욕 검술 (Insult Sword Fighting) 완전 데이터

## 5.1 시스템 규칙

1. 검투는 모욕(Insult)과 응수(Comeback)로 진행
2. 3회 성공적 응수 시 승리 (Sword Master 상대는 5회)
3. 해적들과 싸우며 새로운 모욕과 응수를 학습
4. 모르는 모욕에는 "I am rubber, you are glue" 등의 실패 응답 사용 → 새 모욕 학습 가능
5. Sword Master는 **다른 모욕**을 사용하지만, 일반 해적 응수가 맥락적으로 대응됨

## 5.2 일반 해적 모욕 & 응수

| # | 해적의 모욕 (Insult) | 올바른 응수 (Comeback) |
|---|---------------------|----------------------|
| 1 | You fight like a dairy farmer! | How appropriate. You fight like a cow. |
| 2 | This is the END for you, you gutter-crawling cur! | And I've got a little TIP for you. Get the POINT? |
| 3 | I've spoken with apes more polite than you. | I'm glad to hear you attended your family reunion. |
| 4 | Soon you'll be wearing my sword like a shish kebab! | First you'd better stop waving it like a feather-duster. |
| 5 | People fall at my feet when they see me coming. | Even BEFORE they smell your breath? |
| 6 | I once owned a dog that was smarter than you. | He must have taught you everything you know. |
| 7 | Nobody's ever drawn blood from me and nobody ever will. | You run THAT fast? |
| 8 | You make me want to puke. | You make me think somebody already did. |
| 9 | I got this scar on my face during a mighty struggle! | I hope now you've learned to stop picking your nose. |
| 10 | Have you stopped wearing diapers yet? | Why, did you want to borrow one? |
| 11 | I've heard you were a contemptible snot. | Too bad no one's ever heard of YOU at all. |
| 12 | You're no match for my brains, you poor fool. | I'd be in real trouble if you ever used them. |
| 13 | My handkerchief will wipe up your ugly face. | So you got that job as janitor, after all. |
| 14 | I'm not going to take your insolence sitting down! | Your hemorrhoids are flaring up again, eh? |
| 15 | There are no words for how disgusting you are. | Yes there are. You just never learned them. |
| 16 | Every word you say to me is stupid. | I wanted to make sure you'd feel comfortable with me. |

## 5.3 Sword Master(Carla)의 모욕 & 대응

Sword Master는 다른 표현을 사용하지만, 기존 응수로 대응 가능:

| Sword Master의 모욕 | 올바른 응수 | 대응하는 해적 모욕 |
|---------------------|-----------|-----------------|
| I will milk every drop of blood from your body! | How appropriate. You fight like a cow. | #1 |
| My tongue is sharper than any sword. | First you'd better stop waving it like a feather-duster. | #4 |
| My name is feared in every dirty corner of this island! | So you got that job as janitor, after all. | #13 |
| Only once have I met such a coward! | He must have taught you everything you know. | #6 |
| No one will ever catch ME fighting as badly as you do. | You run THAT fast? | #7 |
| My wisest enemies run away at the first sight of me! | Even BEFORE they smell your breath? | #5 |
| If your brother's like you, better to marry a pig. | You make me think somebody already did. | #8 |
| My last fight ended with my hands covered with blood. | I hope now you've learned to stop picking your nose. | #9 |
| Now I know what filth and stupidity really are. | I'm glad to hear you attended your family reunion. | #3 |
| I've got a long, sharp lesson for you to learn today. | And I've got a little TIP for you. Get the POINT? | #2 |
| My sword is famous all over the Caribbean! | Too bad no one's ever heard of YOU at all. | #11 |
| I usually see people like you passed-out on tavern floors. | Even BEFORE they smell your breath? | #5 |
| There are no clever moves that can help you now. | Yes there are. You just never learned them. | #15 |
| You are a pain in the backside, sir! | Your hemorrhoids are flaring up again, eh? | #14 |
| Every word you say to me is stupid. | I wanted to make sure you'd feel comfortable with me. | #16 |

---

# 6. 전체 장소 목록 & 맵 구조

## 6.1 Mêlée Island 장소

| 장소 | 위치 | 주요 기능/아이템 |
|------|------|----------------|
| **Lookout Point** (전망대) | 섬 최상단 | 게임 시작점, 망루지기 |
| **Docks** (부두) | 전망대 아래 | Scumm Bar 입구, Elaine 포스터 |
| **Scumm Bar** | 부두 첫 번째 건물 | 해적 수뇌부, 주방(냄비, 고기, 물고기), 빈 머그컵들, Grog 자판기 |
| **Low Street** | 마을 동쪽 | Citizen of Mêlée(지도상), 천한 해적들, 부두 가게 입구, 감옥 |
| **Voodoo Lady's Den** | Low Street 문 | 고무 닭, 부두 여사제 상담 |
| **High Street / Store** | 시계탑 아래 | 잡화점(칼, 삽, 숨 민트, 금고) |
| **Governor's Mansion** | 마을 서쪽 끝 | Fabulous Idol, 도둑질 시련, Sheriff Shinetop |
| **Jail** (감옥) | Low Street | Otis 수감, Grog으로 해방 |
| **Church** (교회) | 마을 내 | Part 4 최종전 장소 |
| **Clearing** (공터) | 섬 지도 중앙 | 서커스 텐트, Fettucini Brothers |
| **Fork** (갈림길) | 숲 | 보물 찾기 시작점, 노란 꽃 |
| **Forest Paths** | 섬 전역 | 해적들과 검투, 보물 경로 |
| **Captain Smirk's Gym** | 동쪽 반도 | 검술 훈련 |
| **Bridge / Troll** | 동쪽 경로 | Red Herring 퍼즐 |
| **Sword Master's Hideout** | 숲 깊은 곳 | Carla와의 결투 |
| **Meathook's Island** | 북동쪽 (케이블 연결) | 고무 닭으로 이동 |
| **Stan's Ship Emporium** | 밝은 불빛 | Sea Monkey 구매, Part 4 Grog 자판기 |

## 6.2 Sea Monkey 호 (배 내부)

| 장소 | 아이템/기능 |
|------|-----------|
| **Captain's Quarters** | 깃펜, 잉크, 먼지 책, 캐비닛(열쇠필요)→레시피+시나몬 |
| **Deck** | Jolly Roger(돛대 꼭대기), 대포 |
| **Kitchen** | 냄비, 시리얼→열쇠, 큰 조리솥 |
| **Storeroom** | 고급 와인, 밧줄, 화약 |

## 6.3 Monkey Island 장소

| 장소 | 위치 | 주요 기능/아이템 |
|------|------|----------------|
| **South Beach** | 착륙지점 | 바나나, 안내문 |
| **West Beach** | 서쪽 | Herman 첫 만남, 메모 |
| **Fort on Volcano** | 서쪽 화산 | 대포, 화약, 밧줄, 망원경, 포탄 |
| **River Fork** | 동쪽 산맥 | 돌, 메모, 다리 |
| **Pond** | 중앙 | 바위 시소, 바나나 |
| **Crack** | 중앙 | 노(밧줄 연결 필요) |
| **Banana Tree Beach** | 남쪽 | 바나나, 보트 |
| **Cannibal Village** | 북쪽 | 거대 원숭이 머리 근처, 과일 그릇, 게스트룸 |
| **Giant Monkey Head** | 북쪽 | 토템폴 퍼즐, 지하 입구 |
| **Underground Maze** | 원숭이 머리 아래 | Navigator's Head 사용, 유기적 미로 |
| **LeChuck's Ghost Ship** | 미로 최심부 | Voodoo Root 획득 |

---

# 7. 전체 아이템 목록

## Part 1 아이템

| 아이템 | 획득 장소 | 용도 |
|--------|----------|------|
| Pot (냄비) | Scumm Bar 주방 | 서커스 헬멧, 대포 발사 헬멧 |
| Hunk of Meat (고기) | Scumm Bar 주방 | 꽃과 결합→수면제 고기 |
| Red Herring (물고기) | Scumm Bar 밖 널빤지 | 트롤에게 제공 |
| Sword (칼) | 잡화점 | 검투 필수 |
| Shovel (삽) | 잡화점 | 보물 파기 |
| Breath Mints | 잡화점 | 부두 레시피 재료 |
| Treasure Map | Citizen of Mêlée | 보물 경로 안내, 불꽃 생성용 |
| Yellow Petal (꽃) | 숲 경로 | 고기와 결합→수면제 |
| Rubber Chicken with Pulley | 부두 가게 | Meathook 섬 케이블 이동 |
| 100% Cotton T-shirt | Sword Master 승리 | 시련 완료 증명 |
| Fabulous Idol | 총독 저택 수중 | 시련 완료 증명 |
| Lost Treasure | 숲 보물 매장지 | 시련 완료 증명 |
| Minutes (동전) | 천한 해적들 | 소액 화폐 |
| Pieces of Eight | 서커스 등 | 화폐 |
| Note of Credit | 잡화점 금고 | Sea Monkey 구매 |
| Stew Pot / Mug | Scumm Bar | Grog 운반 |
| Grog | Grog 자판기 | 감옥 자물쇠 녹이기 |
| Gopher Repellent | 총독 저택 시퀀스 | Otis에게 줌→당근 케이크 획득 |
| Compass | Stan | Sea Monkey 구매 시 증정 |
| Brochures | Stan | 식인종과의 교환 |

## Part 2 아이템

| 아이템 | 획득 장소 | 용도 |
|--------|----------|------|
| Feather Pen | 선장실 | 부두 레시피 재료 |
| Ink | 선장실 | 부두 레시피 재료 |
| Dusty Book | 선장실 서랍 | 읽기 - 배경 정보 |
| Jolly Roger | 돛대 꼭대기 | 부두 레시피 재료 |
| Cereal | 주방 벽장 | 부두 레시피 재료, 열쇠 포함 |
| Small Key | 시리얼 경품 | 캐비닛 열기 |
| Pot (주방) | 주방 카운터 | 헬멧 |
| Fine Wine | 창고 상자 | 부두 레시피 재료 |
| Giant Rope | 창고 | 대포 도화선 |
| Gunpowder | 창고 통 | 부두 레시피+대포 |
| Cinnamon Sticks | 캐비닛→상자 | 부두 레시피 재료 |
| Voodoo Recipe | 캐비닛→상자 | 레시피 정보 |
| Flaming Mass | 지도+불꽃 | 대포 점화 |

## Part 3 아이템

| 아이템 | 획득 장소 | 용도 |
|--------|----------|------|
| Bananas (5개) | 여러 해변/마을 | 원숭이 유인 |
| Rope(s) | 요새, 시체 | 틈새 하강 |
| Rock | 강 갈림길 | 시소 퍼즐 |
| Cannonball | 요새 대포 | 시소 퍼즐 |
| Gunpowder | 요새 | (Part 3용) |
| Spyglass | 요새 | Herman과 교환 |
| Oars | 틈새 바닥 | 보트 항해 |
| Notes/Memos | 섬 곳곳 | 스토리/Achievement |
| Wimpy Little Idol | 원숭이 머리 근처 | 식인종과 교환 |
| Navigator's Head | 식인종 | 미로 길안내 |
| Skull | 게스트룸 | 탈출용 |
| Jug o' Grog | 유령선 잠자는 유령 | 쥐 취하게 함 |
| Glob of Grease | 취한 쥐 | 삐걱 문 윤활 |
| Ghost Tools | 유령 경비 옆 | 빛나는 상자 열기 |
| Voodoo Root | 유령선 상자 | 반유령 물약 핵심 재료 |
| Ghost Pirate Spritzer | 식인종 제작 | 유령 퇴치 |

## Part 4 아이템

| 아이템 | 획득 장소 | 용도 |
|--------|----------|------|
| Root Beer | Stan's Grog 자판기 | **최종 무기 — LeChuck 소멸** |

---

# 8. 퍼즐 & 이벤트 흐름도

```
[Part 1: The Three Trials]
├── 시련 1: 검술
│   ├── 칼 구매 → 트롤 통과(Red Herring) → Smirk 훈련
│   ├── 해적들과 검투 (모욕/응수 학습)
│   ├── 잡화점주인 미행 → Sword Master 위치 파악
│   └── Carla 격파 → T-shirt 획득
├── 시련 2: 보물
│   ├── 서커스 → 478 pieces of eight
│   ├── 삽+지도 구매
│   └── 숲 방향 퍼즐 → 보물 발굴
├── 시련 3: 도둑질
│   ├── 꽃+고기 = 수면제 고기 → 푸들 재움
│   ├── 저택 침입 → 초현실 시퀀스
│   └── 수중에서 Idol 획득
├── [Elaine 납치 이벤트 발동]
├── 선원 모집
│   ├── Carla: 납치 소식 전달
│   ├── Meathook: 고무닭+케이블 → 앵무새 터치
│   └── Otis: Grog 머그컵 릴레이 → 자물쇠 녹이기
└── 배 구매
    ├── Stan과 흥정
    ├── 금고 비밀번호 관찰 → 신용 증서 탈취
    └── Sea Monkey 구매

[Part 2: The Journey]
├── 배 탐색 → 아이템 수집
├── 부두 레시피 재료 조합 → 폭발
├── 대포 조립 → Monkey Island 발사
└── 상륙

[Part 3: Under Monkey Island]
├── 섬 탐색 → 아이템 수집
├── 바나나 5개 → 원숭이 유인
├── 토템폴 퍼즐 → Idol 획득
├── 식인종과 교섭 → Navigator's Head 획득
├── Giant Monkey Head → 지하 미로
├── 유령선 침투
│   ├── 깃털 간지럼 → Grog → 쥐 → 윤활유
│   ├── 도구 → 상자 → Voodoo Root
│   └── 식인종에게 전달 → Spritzer 획득
└── LeChuck 이미 출발 → Mêlée 귀환

[Part 4: Guybrush Kicks Butt]
├── 유령들 Spritzer로 제거
├── 교회 진입 → 결혼식 방해
├── Elaine의 자체 탈출 → Spritzer 분실
├── LeChuck에게 맞으며 섬 이동
├── Stan's → Grog 자판기 → Root Beer 획득
└── Root Beer → LeChuck 소멸 → 엔딩
```

---

# 9. 컷씬 & 주요 대화 이벤트 목록

| # | 이벤트 | 트리거 | 내용 요약 |
|---|--------|--------|----------|
| 1 | 오프닝 | 게임 시작 | Guybrush, 전망대에서 망루지기와 대화 |
| 2 | LeChuck 컷씬 | 첫 Scumm Bar 방문 후 | LeChuck의 유령선 내부, 부하에게 Elaine 계획 발표 |
| 3 | 해적 수뇌부 | Scumm Bar 내부 | 세 가지 시련 설명 |
| 4 | 서커스 대포 | Fettucini Brothers 동의 | Guybrush가 대포에서 발사됨 |
| 5 | 검술 훈련 | Captain Smirk | THE MACHINE과의 훈련 시퀀스 |
| 6 | 저택 시퀀스 | 저택 진입 | 초현실적 추격, 의자 트릭, Elaine과의 첫 만남 |
| 7 | 수중 장면 | Sheriff가 투척 | Guybrush+Idol 수중, 날카로운 물건들 주변 |
| 8 | Elaine 납치 | 보물 발견 후 | LeChuck의 유령선 출항, 망루지기 보고 |
| 9 | 총독 저택 확인 | 납치 후 방문 | 재미있는 대화 시퀀스 (토비 등장) |
| 10 | Stan 세일즈 | 처음 방문 | Stan의 과장된 세일즈 피치 |
| 11 | 출항 | 배+선원 완료 | 선원들 모여 출항 |
| 12 | 부두 폭발 | 레시피 완성 | 솥 폭발, Guybrush 기절 |
| 13 | 대포 발사 | 대포 조립 완료 | Monkey Island 상륙 |
| 14 | 식인종 포획 | 마을 탈출 시도 | 3인이 Guybrush 포획→감금 |
| 15 | 유령선 도착 | 미로 통과 | 거대한 유령선 발견 |
| 16 | LeChuck 출발 컷씬 | Voodoo Root 획득 후 | LeChuck이 이미 Mêlée로 출발 |
| 17 | 교회 결혼식 | Part 4 교회 진입 | LeChuck의 강제 결혼, Elaine의 등장 |
| 18 | 날아다니기 | LeChuck 펀치 | 섬 곳곳으로 날아감 |
| 19 | 최종 대결 | Root Beer 사용 | LeChuck 폭발, 불꽃놀이 |
| 20 | 엔딩 | 게임 완료 | Guybrush+Elaine 대화, 분기 엔딩 |

---

# 10. 게임 디자인 특이사항 & 이스터에그

## 10.1 죽음 시스템
- **사실상 불사:** 플레이어가 죽을 수 없는 설계
- **유일한 예외:** 수중에서 10분간 대기 (실제 게임 시간) → Guybrush 익사 → 게임 오버
- 이것 자체가 유머 (보통 포인트 앤 클릭 어드벤처에서는 쉽게 죽음)

## 10.2 주요 이스터에그
- **Ctrl+Shift+W:** 즉시 게임 클리어 (숨겨진 승리 키)
- **Cobb의 세일즈 피치:** ESC로 스킵하면 추가 대사
- **Elaine 포스터:** 게임 진행 상태에 따라 내용이 변함
- **쥐 쫓기:** 천한 해적들 옆 쥐에 마우스를 반복 올리면 도망감
- **시계탑:** 반복 관찰 시 대사 변화
- **10분 숨참기:** 수중 장면에서 실제 10분 대기→사망→Achievement
- **Sea Monkey 침몰:** 바위 시소로 자기 배를 침몰시킬 수 있음 → 엔딩 분기
- **식인종 게스트룸 5회 탈출:** Achievement용

## 10.3 항상 밤 10시
- Mêlée Island은 항상 밤 10시로 고정
- 시간이 흘러도 변하지 않음 (의도적 설계)

## 10.4 ™ 마크 유머
- 캐릭터와 장소 이름 뒤에 ™ 표시 (Mêlée Island™, Monkey Island™)
- 게임 세계를 브랜드 상품처럼 취급하는 메타 유머

---

# 11. 음악 & 사운드 디자인 참고

## 11.1 주요 음악 테마

| 장소/상황 | 분위기 | 비고 |
|----------|--------|------|
| 메인 테마 | 모험적, 카리브해풍 | iMUSE 시스템 (상황에 따라 변화) |
| Scumm Bar | 활기찬 해적 술집 | 레가토 풍 |
| Mêlée Island 마을 | 야간 분위기, 미스터리 | 밤 10시 고정 |
| 부두 가게 | 신비로운, 부두 | Voodoo Lady 테마 |
| Stan's | 과장된, 정신없는 | Stan의 성격 반영 |
| 숲/검투 | 긴장감, 모험 | |
| Sea Monkey 항해 | 바다, 고요함 | |
| Monkey Island | 열대, 미스터리 | 정글 분위기 |
| 유령선 | 공포, 긴장 | 유령 테마 |
| LeChuck 테마 | 위협적, 어두움 | 빌런 모티프 |
| 엔딩 | 승리, 로맨틱 | 불꽃놀이와 함께 |

## 11.2 사운드 이펙트 참고
- SCUMM 엔진의 iMUSE 시스템: 장면 전환 시 음악이 자연스럽게 전환
- 검투 시 칼소리
- 유령 등장 시 효과음
- Grog이 머그컵 녹이는 소리
- 대포 발사음
- LeChuck의 펀치 효과음

---

# 12. 복각을 위한 기술적 참고사항

## 12.1 화면 구성
- 원작: 320×200 (EGA/VGA)
- Special Edition (2009): 와이드스크린 HD
- 화면 상단 ~60%: 게임 화면
- 화면 하단 ~40%: 동사 패널 + 인벤토리

## 12.2 애니메이션 시스템
- 캐릭터: 2D 스프라이트 기반
- 걷기, 대기, 대화, 아이템 사용 등 상태별 애니메이션
- Stan의 팔 흔들기: 고유한 과장 애니메이션 (재킷 무늬는 고정, 팔만 움직임)
- 식인종 마스크: 입이 대화에 맞춰 움직임 (Lemonhead은 머리만 끄덕임)

## 12.3 세이브/로드 시스템
- 언제든 저장/불러오기 가능
- 다중 세이브 슬롯

## 12.4 핵심 게임플레이 루프
```
탐색(Explore) → 아이템 수집(Collect) → 대화(Talk) → 퍼즐 해결(Solve) → 진행(Progress)
```

## 12.5 랜덤 요소
- 잡화점 금고 비밀번호: 매 게임마다 다름
- 해적들이 사용하는 모욕 순서: 랜덤
- 보물 지도의 방향: 매번 같음 (고정)

---

# 13. 대사 & 대화 스타일 가이드

## 13.1 유머 스타일
- **자기비하적 유머:** Guybrush가 자신의 무능함을 인정
- **말장난(Pun):** Red Herring, 모욕 검술 전체
- **메타 유머:** ™ 마크, "Ctrl+W로 이겼다"
- **부조리 유머:** 앵무새가 "맹수", 원숭이 두 마리가 신부
- **반전:** Elaine이 이미 탈출 계획 수행 중
- **재귀적 유머:** 같은 대화를 반복하면 다른 반응

## 13.2 대화 설계 원칙
- 모든 대화 선택지가 최소 1개의 유머 포인트
- "틀린" 선택지가 없음 — 다른 유머가 나올 뿐
- 중요한 정보는 여러 경로로 획득 가능
- NPC 반복 대화 시 새로운 대사 또는 지루해하는 반응

## 13.3 톤 & 무드
- 전체적으로 가볍고 유머러스
- 위험한 상황에서도 코미디 유지
- 로맨스는 순진하고 어설픈 방향
- 공포 요소(유령, 미로)도 유머로 상쇄

---

*이 문서는 The Secret of Monkey Island (1990, LucasArts)의 게임 복각을 위한 참고 아카이브입니다.*
*게임 내 모든 대화, 퍼즐, 아이템, 장소를 최대한 상세히 기록하였습니다.*
*원작의 저작권은 LucasArts/Disney에 있습니다.*
