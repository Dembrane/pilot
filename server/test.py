from server.tasks import add


def gen():
    print("start gen")
    yield 1
    print("end gen")


def test():
    g = gen()
    print("from gen")
    for value in g:
        print(value)


if __name__ == "__main__":
    test()

    add.delay(1, 2)
