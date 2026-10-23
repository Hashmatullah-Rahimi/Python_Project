import random 
def floor1():
    safe_pit = random.choice([1, 2, 3])  
    print("\nFLOOR 1 - FIND YOUR WAY\nThree fire pits: 1, 2, 3. One hides the door to inside. The others are deadly. Choose wisely.")
    while True:
        c = input("Which pit? (1/2/3): ")
        if c in ("1", "2", "3"):
            break
        c = int(c)
    if c == safe_pit:
        print("You land on cold stone. Stairs up!")
        return True
    print("The fire burns you!")
    