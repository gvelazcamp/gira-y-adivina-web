#!/usr/bin/env python3
"""Compila grillas conectadas; conserva las seis palabras y coordenadas originales.
La app sirve únicamente el JS estático resultante, sin generar tableros al jugar.
"""
import json, random, unicodedata
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LIMIT = 36

def normalizar(texto):
    return ''.join(c for c in unicodedata.normalize('NFD', texto.upper().replace('Ñ', '!'))
                   if not unicodedata.combining(c)).replace('!', 'Ñ').replace(' ', '')

def coords(p):
    return [(p['fila'] + (i if p['direccion'] == 'V' else 0),
             p['columna'] + (i if p['direccion'] == 'H' else 0))
            for i in range(len(normalizar(p['respuesta'])))]

class Grilla:
    def __init__(self, palabras):
        self.celdas, self.direcciones, self.letras = {}, defaultdict(set), defaultdict(set)
        self.filas = self.columnas = 0
        for p in palabras:
            self.agregar(p)

    def agregar(self, palabra):
        for posicion, letra in zip(coords(palabra), normalizar(palabra['respuesta'])):
            assert self.celdas.get(posicion, letra) == letra
            self.celdas[posicion] = letra
            self.direcciones[posicion].add(palabra['direccion'])
            self.letras[letra].add(posicion)
            self.filas = max(self.filas, posicion[0] + 1)
            self.columnas = max(self.columnas, posicion[1] + 1)

    def validar_posicion(self, palabra, fila, columna, direccion):
        df, dc = (1, 0) if direccion == 'V' else (0, 1)
        fin_f, fin_c = fila + df * (len(palabra) - 1), columna + dc * (len(palabra) - 1)
        if min(fila, columna) < 0 or max(fin_f, fin_c) >= LIMIT:
            return 0
        if (fila - df, columna - dc) in self.celdas or (fin_f + df, fin_c + dc) in self.celdas:
            return 0
        cruces = 0
        for i, letra in enumerate(palabra):
            f, c = fila + df * i, columna + dc * i
            if (f, c) in self.celdas:
                if self.celdas[(f, c)] != letra or direccion in self.direcciones[(f, c)]:
                    return 0
                cruces += 1
            elif (f + dc, c + df) in self.celdas or (f - dc, c - df) in self.celdas:
                return 0
        return cruces

    def opciones(self, respuesta):
        palabra, vistas = normalizar(respuesta), set()
        for i, letra in enumerate(palabra):
            for f, c in sorted(self.letras[letra]):
                for direccion in ('H', 'V'):
                    if direccion in self.direcciones[(f, c)]:
                        continue
                    fila, columna = f - (i if direccion == 'V' else 0), c - (i if direccion == 'H' else 0)
                    llave = (fila, columna, direccion)
                    if llave in vistas:
                        continue
                    vistas.add(llave)
                    cruces = self.validar_posicion(palabra, *llave)
                    if cruces:
                        filas = max(self.filas, fila + (len(palabra) if direccion == 'V' else 1))
                        columnas = max(self.columnas, columna + (len(palabra) if direccion == 'H' else 1))
                        crecimiento = filas * columnas - self.filas * self.columnas
                        yield llave, cruces * 100 - crecimiento * .4 - abs(filas - columnas) * .8

def validar(grilla):
    celdas, dirs, miembros = {}, defaultdict(set), defaultdict(set)
    for i, p in enumerate(grilla['palabras']):
        for k, letra in zip(coords(p), normalizar(p['respuesta'])):
            assert 0 <= k[0] < grilla['filas'] and 0 <= k[1] < grilla['columnas']
            assert celdas.get(k, letra) == letra, ('Cruce incompatible', grilla['id'], p)
            assert p['direccion'] not in dirs[k], ('Solapamiento paralelo', grilla['id'], p)
            celdas[k] = letra
            dirs[k].add(p['direccion'])
            miembros[k].add(i)
    conectadas = {0}
    while True:
        antes = len(conectadas)
        for indices in miembros.values():
            if conectadas & indices:
                conectadas |= indices
        if len(conectadas) == antes:
            break
    assert len(conectadas) == len(grilla['palabras']), ('Grilla desconectada', grilla['id'])
    for df, dc, direccion in [(1, 0, 'V'), (0, 1, 'H')]:
        palabras = {tuple(coords(p)) for p in grilla['palabras'] if p['direccion'] == direccion}
        for f, c in celdas:
            if (f - df, c - dc) in celdas:
                continue
            secuencia = []
            while (f, c) in celdas:
                secuencia.append((f, c)); f += df; c += dc
            if len(secuencia) > 1:
                assert tuple(secuencia) in palabras, ('Secuencia sin pista', grilla['id'], secuencia)


def main():
    bases = json.loads((ROOT / 'contenido/palabras-cruzadas-originales.json').read_text())
    nuevas = []
    respuestas, pistas = set(), set()
    for line in (ROOT / 'contenido/palabras-cruzadas-banco.tsv').read_text().splitlines():
        if not line.strip() or line.startswith('#'):
            continue
        respuesta, pista = line.split('\t', 1)
        key = normalizar(respuesta)
        assert key not in respuestas and pista not in pistas, ('Contenido repetido', respuesta)
        respuestas.add(key); pistas.add(pista)
        nuevas.append({'respuesta': respuesta, 'pista': pista})
    salida = []
    for numero, base in enumerate(bases, 1):
        if numero == 1:
            resultado = dict(base, nivel=1, dificultad='Inicial')
        else:
            for intento in range(8):
                rng = random.Random(271828 + numero * 1000 + intento)
                palabras = [dict(p) for p in base['palabras']]
                disponibles = nuevas[:]
                grilla = Grilla(palabras)
                longitud = min(10, 5 + numero // 2)
                while len(palabras) < 50:
                    candidatas = disponibles[:]
                    rng.shuffle(candidatas)
                    candidatas.sort(key=lambda p: abs(len(normalizar(p['respuesta'])) - longitud) + rng.random() * 7)
                    mejor = None
                    for p in candidatas[:100]:
                        for (fila, columna, direccion), puntos in grilla.opciones(p['respuesta']):
                            puntos += rng.random() * 9
                            if mejor is None or puntos > mejor[0]:
                                mejor = (puntos, p, fila, columna, direccion)
                    if mejor is None:
                        break
                    _, p, fila, columna, direccion = mejor
                    puesta = dict(p, fila=fila, columna=columna, direccion=direccion)
                    grilla.agregar(puesta); palabras.append(puesta); disponibles.remove(p)
                if len(palabras) == 50:
                    nuevas = disponibles
                    break
            else:
                raise RuntimeError('No se pudo completar ' + base['id'])
            resultado = dict(base, filas=grilla.filas, columnas=grilla.columnas, palabras=palabras,
                             nivel=numero, dificultad='Normal' if numero < 5 else 'Intermedia' if numero < 9 else 'Desafío')
        validar(resultado)
        # Los guardados anteriores conservan coordenadas, índices, ayudas y letras.
        assert resultado['palabras'][:len(base['palabras'])] == base['palabras']
        salida.append(resultado)
        print(f"{resultado['id']}: {len(resultado['palabras'])} palabras, {resultado['filas']}×{resultado['columnas']} · {resultado['dificultad']}", flush=True)
    texto = '/* Cruces verificados. Generado con scripts/generar-palabras-cruzadas.py.\n' \
            '   Las palabras originales conservan sus posiciones para respetar el guardado. */\n' \
            + 'window.PALABRAS_CRUZADAS_DATOS=' + json.dumps(salida, ensure_ascii=False, indent=2) + ';\n'
    (ROOT / 'palabras-cruzadas-datos.js').write_text(texto)
    print('Total:', sum(len(p['palabras']) for p in salida), 'respuestas únicas.', flush=True)

if __name__ == '__main__':
    main()
