import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Dimensions, TouchableOpacity, TextInput, Animated, Easing } from 'react-native';

const { width, height } = Dimensions.get('window');

const COLOR_PALETTES = [
  { id: 1, name: 'Electric Cyan', color: '#00f2fe', bgCard: 'rgba(0, 242, 254, 0.08)' },
  { id: 2, name: 'Hyper Magenta', color: '#ff007f', bgCard: 'rgba(255, 0, 127, 0.08)' },
  { id: 3, name: 'Acid Lime', color: '#00ff87', bgCard: 'rgba(0, 255, 135, 0.08)' },
  { id: 4, name: 'Solar Gold', color: '#ffd700', bgCard: 'rgba(255, 215, 0, 0.08)' },
  { id: 5, name: 'Quantum Violet', color: '#9d4edd', bgCard: 'rgba(157, 78, 221, 0.08)' },
  { id: 6, name: 'Plasma Orange', color: '#ff5400', bgCard: 'rgba(255, 84, 0, 0.08)' },
  { id: 7, name: 'Deep Sapphire', color: '#4361ee', bgCard: 'rgba(67, 97, 238, 0.08)' },
  { id: 8, name: 'Super Nova', color: '#f72585', bgCard: 'rgba(247, 37, 133, 0.08)' },
];

const GRID_SIZES = [
  { size: 3, label: '3x3 (Einfach)' },
  { size: 5, label: '5x5 (Mittel)' },
  { size: 7, label: '7x7 (Schwer)' },
  { size: 9, label: '9x9 (Extrem)' },
];

export default function App() {
  const [screen, setScreen] = useState('menu');
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTES[0]);
  const [gridSize, setGridSize] = useState(3);

  const totalCells = gridSize * gridSize;
  const gridCells = Array.from({ length: totalCells }, (_, i) => i + 1);

  // Account & Freunde
  const [username] = useState('Operator_' + Math.floor(Math.random() * 1000));
  const [friendInput, setFriendInput] = useState('');
  const [friendsList, setFriendsList] = useState([
    { id: 1, name: 'Kaelen X', status: 'Online' },
    { id: 2, name: 'Vex Code', status: 'Im Spiel' },
  ]);

  // Solo-Modus States
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [sequence, setSequence] = useState([]);
  const [playerSequence, setPlayerSequence] = useState([]);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [activePad, setActivePad] = useState(null);

  // Interaktiver Hintergrund: Pulsierende Ringe
  const [interactivePulses, setInteractivePulses] = useState([]);

  // Online States
  const [roomCode, setRoomCode] = useState('');
  const [isMyTurn, setIsMyTurn] = useState(false);

  // Ring-Animation: Klein bleiben, sehr sanft ausfaden
  const triggerBackgroundPulse = (x, y) => {
    const pulseId = Date.now() + Math.random();
    const animScale = new Animated.Value(0);
    const animOpacity = new Animated.Value(0.7);

    const newPulse = { id: pulseId, x, y, animScale, animOpacity };
    setInteractivePulses((prev) => [...prev, newPulse]);

    Animated.parallel([
      Animated.timing(animScale, {
        toValue: 1,
        duration: 1600, // Deutlich langsamer im Ablauf
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(animOpacity, {
        toValue: 0,
        duration: 1600, // Gleichmäßig sanftes Verblassen über die gesamte Dauer
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start(() => {
      setInteractivePulses((prev) => prev.filter(p => p.id !== pulseId));
    });
  };

  const addFriend = () => {
    if (!friendInput.trim()) return;
    setFriendsList([...friendsList, { id: Date.now(), name: friendInput, status: 'Offline' }]);
    setFriendInput('');
  };

  const startSoloGame = () => {
    setScore(0);
    setRound(1);
    setScreen('playingSolo');
    nextSoloRound([], 1);
  };

  const nextSoloRound = (currentSeq, currentRoundNum) => {
    setIsShowingSequence(true);
    setPlayerSequence([]);

    const nextPad = Math.floor(Math.random() * totalCells) + 1;
    const newSeq = [...currentSeq, nextPad];
    setSequence(newSeq);

    const speed = Math.max(250, 600 - currentRoundNum * 25);

    newSeq.forEach((padId, index) => {
      setTimeout(() => {
        setActivePad(padId);
        setTimeout(() => setActivePad(null), speed * 0.45);
      }, (index + 1) * speed);
    });

    setTimeout(() => {
      setIsShowingSequence(false);
    }, (newSeq.length + 1) * speed);
  };

  const handleSoloPadPress = (padId, event) => {
    if (isShowingSequence || screen !== 'playingSolo') return;

    if (event && event.nativeEvent) {
      triggerBackgroundPulse(event.nativeEvent.pageX, event.nativeEvent.pageY);
    }

    setActivePad(padId);
    setTimeout(() => setActivePad(null), 150);

    const newPlayerSeq = [...playerSequence, padId];
    setPlayerSequence(newPlayerSeq);
    const currentIndex = newPlayerSeq.length - 1;

    if (newPlayerSeq[currentIndex] !== sequence[currentIndex]) {
      setScreen('gameover');
      return;
    }

    if (newPlayerSeq.length === sequence.length) {
      setScore(s => s + round * (gridSize * 50));
      const nextR = round + 1;
      setRound(nextR);
      setTimeout(() => nextSoloRound(sequence, nextR), 700);
    }
  };

  const createOnlineRoom = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomCode(code);
    setIsMyTurn(true);
    setScreen('playingOnline');
  };

  const joinOnlineRoom = () => {
    if (!roomCode.trim()) return;
    setIsMyTurn(false);
    setScreen('playingOnline');
  };

  const handleOnlinePadPress = (padId, event) => {
    if (!isMyTurn) return;

    if (event && event.nativeEvent) {
      triggerBackgroundPulse(event.nativeEvent.pageX, event.nativeEvent.pageY);
    }

    setActivePad(padId);
    setTimeout(() => setActivePad(null), 150);

    setIsMyTurn(false);
    setTimeout(() => {
      setIsMyTurn(true);
    }, 400);
  };

  return (
    <View style={styles.container}>
      <View style={styles.ambientGlow} pointerEvents="none" />

      {/* Kleine, sanfte, langsam auslaufende Licht-Ringe */}
      {interactivePulses.map((p) => {
        const interpolatedSize = p.animScale.interpolate({
          inputRange: [0, 1],
          outputRange: [15, 220], // Bleibt jetzt schön klein (maximal 220px Durchmesser)
        });

        return (
          <Animated.View
            key={p.id}
            style={[
              styles.interactivePulse,
              {
                left: p.x,
                top: p.y,
                borderColor: selectedColor.color,
                backgroundColor: selectedColor.bgCard,
                width: interpolatedSize,
                height: interpolatedSize,
                borderRadius: Animated.divide(interpolatedSize, 2),
                marginLeft: Animated.multiply(interpolatedSize, -0.5),
                marginTop: Animated.multiply(interpolatedSize, -0.5),
                opacity: p.animOpacity,
              },
            ]}
            pointerEvents="none"
          />
        );
      })}

      <View style={styles.scanlines} pointerEvents="none" />

      {/* --- HAUPTMENÜ --- */}
      {screen === 'menu' && (
        <View style={styles.centerContainer}>
          <View style={[styles.logoBadge, { borderColor: selectedColor.color, backgroundColor: selectedColor.bgCard }]}>
            <Text style={[styles.logoText, { color: selectedColor.color }]}>ECHOS</Text>
          </View>
          <Text style={styles.title}>ECHO CHAMBER</Text>
          <Text style={styles.subtitle}>NEURAL AUDIO INTERFACE // {username}</Text>

          <TouchableOpacity activeOpacity={0.8} style={[styles.primaryButton, { shadowColor: selectedColor.color }]} onPress={startSoloGame}>
            <Text style={styles.primaryButtonText}>SOLO SEQUENZ STARTEN</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.8} style={styles.primaryButtonVs} onPress={() => setScreen('onlineLobby')}>
            <Text style={styles.primaryButtonTextVs}>ONLINE DUELL (2 DEVICES)</Text>
          </TouchableOpacity>

          <View style={styles.menuRow}>
            <TouchableOpacity activeOpacity={0.8} style={styles.secondaryButtonSmall} onPress={() => setScreen('gridSelect')}>
              <Text style={styles.secondaryButtonText}>GRID: {gridSize}x{gridSize}</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.8} style={[styles.secondaryButtonSmall, { borderColor: selectedColor.color }]} onPress={() => setScreen('colorSelect')}>
              <Text style={[styles.secondaryButtonText, { color: selectedColor.color }]}>PALETTE</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity activeOpacity={0.8} style={[styles.secondaryButton, { marginTop: 10, width: 290 }]} onPress={() => setScreen('friends')}>
            <Text style={styles.secondaryButtonText}>FREUNDE ({friendsList.length})</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* --- GRID GRÖSSEN AUSWAHL --- */}
      {screen === 'gridSelect' && (
        <View style={styles.centerContainer}>
          <Text style={styles.sectionTitle}>RASTER-GRÖSSE</Text>
          <Text style={styles.subtitle}>Wähle die Komplexität</Text>

          <View style={{ gap: 10, marginBottom: 20 }}>
            {GRID_SIZES.map((item) => (
              <TouchableOpacity
                key={item.size}
                activeOpacity={0.8}
                style={[
                  styles.secondaryButton, 
                  gridSize === item.size && { borderColor: selectedColor.color, backgroundColor: selectedColor.bgCard }
                ]}
                onPress={() => setGridSize(item.size)}
              >
                <Text style={[styles.secondaryButtonText, gridSize === item.size && { color: selectedColor.color, fontWeight: '900' }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity activeOpacity={0.8} style={styles.primaryButton} onPress={() => setScreen('menu')}>
            <Text style={styles.primaryButtonText}>ÜBERNEHMEN</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* --- FREUNDE VERWALTEN --- */}
      {screen === 'friends' && (
        <View style={styles.centerContainer}>
          <Text style={styles.sectionTitle}>NETZWERK-KONTAKTE</Text>
          
          <View style={styles.friendInputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="Operator ID eingeben..."
              placeholderTextColor="#475569"
              value={friendInput}
              onChangeText={setFriendInput}
            />
            <TouchableOpacity style={styles.addBtn} onPress={addFriend}>
              <Text style={styles.addBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.friendListContainer}>
            {friendsList.map((f) => (
              <View key={f.id} style={styles.friendCard}>
                <Text style={styles.friendName}>{f.name}</Text>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: f.status === 'Online' ? '#00ff87' : '#475569' }]} />
                  <Text style={styles.friendStatus}>{f.status}</Text>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity activeOpacity={0.8} style={styles.primaryButton} onPress={() => setScreen('menu')}>
            <Text style={styles.primaryButtonText}>ZURÜCK</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* --- ONLINE LOBBY --- */}
      {screen === 'onlineLobby' && (
        <View style={styles.centerContainer}>
          <Text style={styles.sectionTitle}>SYNCHRONISATION</Text>
          <Text style={styles.subtitle}>Echtzeit-Verbindung über Vercel</Text>

          <TouchableOpacity activeOpacity={0.8} style={styles.primaryButton} onPress={createOnlineRoom}>
            <Text style={styles.primaryButtonText}>NEUEN RAUM ERSTELLEN</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ODER</Text>
            <View style={styles.dividerLine} />
          </View>

          <TextInput
            style={[styles.textInput, { width: 290, textAlign: 'center', marginBottom: 12, letterSpacing: 2 }]}
            placeholder="RAUM-CODE"
            placeholderTextColor="#475569"
            value={roomCode}
            onChangeText={setRoomCode}
            autoCapitalize="characters"
          />

          <TouchableOpacity activeOpacity={0.8} style={styles.secondaryButton} onPress={joinOnlineRoom}>
            <Text style={styles.secondaryButtonText}>VERBINDEN</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.8} style={[styles.secondaryButton, { marginTop: 20, borderColor: 'transparent' }]} onPress={() => setScreen('menu')}>
            <Text style={[styles.secondaryButtonText, { color: '#64748b' }]}>ABBRECHEN</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* --- FARB-PALETTE AUSWAHL --- */}
      {screen === 'colorSelect' && (
        <View style={styles.centerContainer}>
          <Text style={styles.sectionTitle}>FARB-PALETTE</Text>
          <Text style={styles.subtitle}>Wähle deinen Neon-Vibe</Text>
          
          <View style={styles.paletteGrid}>
            {COLOR_PALETTES.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                style={[
                  styles.paletteCard, 
                  selectedColor.id === item.id && { borderColor: item.color, backgroundColor: item.bgCard }
                ]}
                onPress={() => setSelectedColor(item)}
              >
                <View style={[styles.paletteCircle, { backgroundColor: item.color, shadowColor: item.color }]} />
                <Text style={styles.paletteText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity activeOpacity={0.8} style={[styles.primaryButton, { shadowColor: selectedColor.color }]} onPress={() => setScreen('menu')}>
            <Text style={styles.primaryButtonText}>BESTÄTIGEN</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* --- SOLO SPIEL --- */}
      {screen === 'playingSolo' && (
        <View style={styles.gameContainer}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerLabel}>RUNDE</Text>
              <Text style={styles.headerValue}>{round}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.headerLabel}>SCORE</Text>
              <Text style={styles.headerValue}>{score}</Text>
            </View>
          </View>

          <View style={[styles.dynamicGrid, { width: 320, height: 320 }]}>
            {gridCells.map((padId) => {
              const isActive = activePad === padId;
              const sizePercentage = `${100 / gridSize - 3}%`;

              return (
                <TouchableOpacity
                  key={padId}
                  activeOpacity={0.5}
                  style={[
                    styles.dynamicCell,
                    { width: sizePercentage, height: sizePercentage, borderRadius: gridSize > 5 ? 8 : 12 },
                    isActive && { 
                      backgroundColor: selectedColor.color, 
                      borderColor: '#ffffff',
                      shadowColor: selectedColor.color,
                      shadowOpacity: 1,
                      shadowRadius: 20,
                      elevation: 20,
                      transform: [{ scale: 0.95 }]
                    }
                  ]}
                  onPress={(e) => handleSoloPadPress(padId, e)}
                />
              );
            })}
          </View>

          <TouchableOpacity activeOpacity={0.8} style={styles.inGameMenuBtn} onPress={() => setScreen('menu')}>
            <Text style={styles.inGameMenuText}>ABBRUCH</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* --- ONLINE SPIEL --- */}
      {screen === 'playingOnline' && (
        <View style={styles.gameContainer}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerLabel}>RAUM</Text>
              <Text style={styles.headerValue}>{roomCode}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.headerLabel}>ZUG</Text>
              <View style={[styles.turnIndicatorDot, { backgroundColor: isMyTurn ? '#00ff87' : '#ff0844' }]} />
            </View>
          </View>

          <View style={[styles.dynamicGrid, { width: 320, height: 320 }]}>
            {gridCells.map((padId) => {
              const isActive = activePad === padId;
              const sizePercentage = `${100 / gridSize - 3}%`;

              return (
                <TouchableOpacity
                  key={padId}
                  activeOpacity={0.5}
                  style={[
                    styles.dynamicCell,
                    { width: sizePercentage, height: sizePercentage, borderRadius: gridSize > 5 ? 8 : 12 },
                    !isMyTurn && { opacity: 0.5 },
                    isActive && { 
                      backgroundColor: selectedColor.color, 
                      borderColor: '#ffffff',
                      shadowColor: selectedColor.color,
                      shadowOpacity: 1,
                      shadowRadius: 20,
                    }
                  ]}
                  onPress={(e) => handleOnlinePadPress(padId, e)}
                />
              );
            })}
          </View>

          <TouchableOpacity activeOpacity={0.8} style={styles.inGameMenuBtn} onPress={() => setScreen('menu')}>
            <Text style={styles.inGameMenuText}>ABBRUCH</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* --- GAME OVER --- */}
      {screen === 'gameover' && (
        <View style={styles.centerContainer}>
          <Text style={styles.gameOverText}>SIGNAL VERLOREN</Text>
          <Text style={styles.subtitle}>Frequenz-Kollision erkannt.</Text>
          <Text style={styles.finalScore}>FINALER SCORE: {score}</Text>

          <TouchableOpacity activeOpacity={0.8} style={[styles.primaryButton, { shadowColor: selectedColor.color }]} onPress={startSoloGame}>
            <Text style={styles.primaryButtonText}>NEUSTART</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.8} style={[styles.secondaryButton, { marginTop: 10 }]} onPress={() => setScreen('menu')}>
            <Text style={styles.secondaryButtonText}>HAUPTMENÜ</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05070b',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  ambientGlow: {
    position: 'absolute',
    width: 450,
    height: 450,
    borderRadius: 225,
    backgroundColor: 'rgba(0, 242, 254, 0.03)',
    top: height / 2 - 225,
    left: width / 2 - 225,
  },
  interactivePulse: {
    position: 'absolute',
    borderWidth: 1.5,
    zIndex: 5,
    pointerEvents: 'none',
  },
  scanlines: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.012)',
    zIndex: 10,
    pointerEvents: 'none',
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  gameContainer: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  logoBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  logoText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 3,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 3,
  },
  subtitle: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 30,
    letterSpacing: 2,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 4,
    letterSpacing: 2,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 14,
    marginVertical: 6,
    width: 290,
    alignItems: 'center',
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#05070b',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  primaryButtonVs: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 14,
    marginVertical: 6,
    width: 290,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  primaryButtonTextVs: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  menuRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  secondaryButtonSmall: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    width: 140,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 14,
    width: 290,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  secondaryButtonText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 290,
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dividerText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 12,
    letterSpacing: 1,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingHorizontal: 16,
    color: '#fff',
    height: 50,
    fontSize: 14,
    fontWeight: '600',
  },
  friendInputRow: {
    flexDirection: 'row',
    width: 290,
    marginBottom: 15,
    gap: 8,
  },
  addBtn: {
    backgroundColor: '#ffffff',
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    color: '#05070b',
    fontSize: 24,
    fontWeight: '900',
  },
  friendListContainer: {
    width: 290,
    maxHeight: 200,
    marginBottom: 20,
  },
  friendCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  friendName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  friendStatus: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 320,
    marginBottom: 20,
    gap: 8,
  },
  paletteCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 10,
    borderRadius: 14,
    width: 140,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
  },
  paletteCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 10,
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  paletteText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
    paddingHorizontal: 5,
  },
  headerLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  headerValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
  turnIndicatorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 6,
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  dynamicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.01)',
    padding: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  dynamicCell: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  inGameMenuBtn: {
    position: 'absolute',
    top: -65,
    left: 5,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  inGameMenuText: {
    color: '#64748b',
    fontWeight: 'bold',
    fontSize: 11,
    letterSpacing: 1,
  },
  gameOverText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ff0844',
    marginBottom: 6,
    letterSpacing: 2,
    textAlign: 'center',
  },
  finalScore: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 30,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
});