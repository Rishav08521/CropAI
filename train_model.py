import os
import math
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Input, Conv2D, MaxPooling2D, Flatten, Dense, Dropout

# ==================== CONFIG ====================
DATASET_PATH = "leaf_dataset"       # Folder with class subfolders
IMG_HEIGHT, IMG_WIDTH = 128, 128
BATCH_SIZE = 16                     # smaller works better with tiny datasets
EPOCHS = 10
MODEL_FILE = "crop_disease_model.h5"
LABELS_FILE = "class_labels.txt"
VAL_SPLIT = 0.20
# =================================================

# Sanity checks
if not os.path.isdir(DATASET_PATH):
    raise SystemExit(f"[ERROR] '{DATASET_PATH}' not found. Put class folders inside it.")

# ---------- 1) Build Augmenters ----------
# Train augmenter (mild so it still learns with few images)
train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=10,
    width_shift_range=0.05,
    height_shift_range=0.05,
    zoom_range=0.05,
    horizontal_flip=True,
    validation_split=VAL_SPLIT
)
val_datagen = ImageDataGenerator(
    rescale=1./255,
    validation_split=VAL_SPLIT
)

# ---------- 2) Try with validation split ----------
train_gen = train_datagen.flow_from_directory(
    DATASET_PATH,
    target_size=(IMG_HEIGHT, IMG_WIDTH),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='training',
    shuffle=True
)
val_gen = val_datagen.flow_from_directory(
    DATASET_PATH,
    target_size=(IMG_HEIGHT, IMG_WIDTH),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation',
    shuffle=False
)

# If validation is empty (tiny dataset), fall back to "no validation" mode
use_validation = val_gen.samples > 0
if not use_validation:
    print("[WARN] No validation images found. Training without validation…")
    train_datagen_noval = ImageDataGenerator(
        rescale=1./255,
        rotation_range=10,
        width_shift_range=0.05,
        height_shift_range=0.05,
        zoom_range=0.05,
        horizontal_flip=True
    )
    train_gen = train_datagen_noval.flow_from_directory(
        DATASET_PATH,
        target_size=(IMG_HEIGHT, IMG_WIDTH),
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        shuffle=True
    )
    val_gen = None  # no validation

# ---------- 3) Build the CNN ----------
model = Sequential([
    Input(shape=(IMG_HEIGHT, IMG_WIDTH, 3)),
    Conv2D(32, 3, activation='relu'), MaxPooling2D(),
    Conv2D(64, 3, activation='relu'), MaxPooling2D(),
    Flatten(),
    Dense(128, activation='relu'), Dropout(0.30),
    Dense(train_gen.num_classes, activation='softmax')
])

model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

# Steps (safe for tiny datasets)
steps_per_epoch = max(1, math.ceil(train_gen.samples / BATCH_SIZE))
if use_validation:
    validation_steps = max(1, math.ceil(val_gen.samples / BATCH_SIZE))
else:
    validation_steps = None

# Optional callbacks (early stop helps tiny data)
callbacks = [
    tf.keras.callbacks.EarlyStopping(monitor='val_accuracy' if use_validation else 'accuracy',
                                     patience=3, restore_best_weights=True)
]

print("Training model...")
history = model.fit(
    train_gen,
    epochs=EPOCHS,
    steps_per_epoch=steps_per_epoch,
    validation_data=val_gen if use_validation else None,
    validation_steps=validation_steps if use_validation else None,
    callbacks=callbacks
)

# ---------- 4) Save Model & Labels ----------
print(f"Saving model to {MODEL_FILE}…")
model.save(MODEL_FILE)

print(f"Saving class labels to {LABELS_FILE}…")
with open(LABELS_FILE, "w") as f:
    # Keep label order consistent with generator’s indices
    for label, idx in sorted(train_gen.class_indices.items(), key=lambda x: x[1]):
        f.write(label + "\n")

print("✅ Model and labels saved successfully.")
