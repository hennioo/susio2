const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Base URL for API
const API_BASE_URL = 'http://localhost:10000';

// Access code for authentication (from environment variable)
const ACCESS_CODE = process.env.ACCESS_CODE;

// Sample base64 images for testing
const SAMPLE_JPEG = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/4QBoRXhpZgAATU0AKgAAAAgABAEaAAUAAAABAAAAPgEbAAUAAAABAAAARgEoAAMAAAABAAIAAAExAAIAAAARAAAATgAAAAAAAABgAAAAAQAAAGAAAAABcGFpbnQubmV0IDQuMy4xMgAA/9sAQwACAQECAQECAgICAgICAgMFAwMDAwMGBAQDBQcGBwcHBgcHCAkLCQgICggHBwoNCgoLDAwMDAcJDg8NDA4LDAwM/9sAQwECAgIDAwMGAwMGDAgHCAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwM/8AAEQgAZABkAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/aAAwDAQACEQMRAD8A/fyiiigAoorA+JPxF034V+GJdZ1RpBEreVBbwjdPeTkEpDEvdnIwPQfMcKrEA1b7xDouhyiLUdX0+ykPRLi6SPP03EV5h8Yf2p9O+Hmr/wBjeGbGXxj4wxl9J0piUt+u37RcnhFIzlFDTHBxGM7h82fEL4xav4t1Sa6vL6+1SaRiVe8u2lYITkpGf4YlJwEXAA4rn/tT7zjpTsI+xvF3/BRX4VeE0P2fVdQ1yQfdt9JsJSW+jS+XH+tcZ4L/AOCi/gLXL+O31TRdf0SJmx9pHks6c43ZQ5I9AATz0rwT/hJ2PvTPtCp94UWA+1tD1q18U6Hb6np8nm2l2nmRsRg4Psccjsa/LDxH4kg+G3x38WaQHIk0vxNqkG056Fbh0P8A6DX33+y94sHif4HaMzNulswYGI/2SCv/AI6VrwH9vz4ar4P/AGktS1NAVi1e0hvCR3fy/Lf/ANF0gPTtI/4KBeEWsFbUNJ1+G4A+aJbNG3D/AIFKox9TXb+Cf+CgXw58UbE1K41Tw9I3U3lsfLH0eIN/49iviqDUVkX5XVx6o25f5/yqzC8bjhhioyDxnPY9/egD9TvC/wASPDHjWNX0PxFpOpsw+VLa7jkf/vgNu/SugzX5TRzS2kweN3jlXkOjYZfxH0P5V6H8Hf2nfE3w91aOW21bU2t0YedbahcPNCw7AoxOw9mXDD1PSgD9CqK4/wCG/wAY/DPxS01LjRdShmeQZe3Zt0if7ynkfrXYUAFY3j3xvp3w58G6nrt+8n2bTIGlKRfflbokagHl2YhQB1JA61s14V+2P4nZLfQfDsZ4mY3lwR3Vfljz+Lsx/wCAUAeH6zrtzrGoz3l5NPd3d0xkmnmbdJM7HJdj3JJ5PfpVU3xPeozAk8VYisgTQIjHJN0zTftDL3qY2akZX+dZ11NPYN5tlcyW0q/eUcqfZl4YfQ0AaC3JqVZSWxXMrqsT8XC+We0inK/8Cbhh/vbvrWnZ61GwG4kZGQQeQfp3/CgD1X9nDxWPDPx20SRmxDeSm1fJxw43J/4+i17r+1n4NXxl8ALu8x+/0G8S6B7hQDG2fpv3fhXz58MLM654wslXqrlyOu1QCf8APrX0z45vRp/wW1x2+XFnJk+wAP8ASgD4KMDwyrPbyMsq9CpwR61citXA44PqKw3keR2d2Lt1Zm6n8at2uoOvfigDbtIxIPmUMPUda27L7Pp48yfUIhGOg3AsfbA61ittMw9D61p+HfCN54puY7ezieTccMw+6g9SfT/EdqAOj8DfGjW/hvq8V1pGoXFuUOTEGylwP9pDw38uxHSv0B+G/wAStP8Aid4Nt9X0/MbFjHcW7HLW867S8Ze4BGRkZBAYdRX5/wDiT4eLYLOlteQXbx4YRxMcxe5YjAJ9vrXa/sz/ABnl8C+NrHSrq6ZdH1y4WCSVjn7PMxxG4PoTlW9Ac/dNAH6D18m/tczN/wALA02PJxHpKkLngEzNkf8AjgFfWVfHP7W8zSeP9RfJ/wBJuixPUna3J/76P5UgOQitfM9q3NP0Jm7Vc8FeCrjxhqP2e33RxRx+ZLLjIiTtz3J6AVp6hqFholq0MLeZdOuJJcfKgPZV/qe9NAVYvDFv09s1X1DwxZ3cJV4Y896xG8QTTHqc1cs/F1zZEeVK4X+63Kn8DQBZ0jwjpOiyebZ3GpyQkZDw3O4MPcYBH41vWjz2kfmWd2JIyCFhu4AxYdirDa341jweMYroYuF+znPMicxn/d9PpxUF9qNpbECO1IuZGLMSxyAcZ3E8knjAHQYHc5APUf2f9Sez1C9McRuLiBvLmjiJ3sqnDBR3YHBPuB6V9L3l0t14D1CRTlWsZGU+hCnFfPPwS0xvDngu31C4XdczQM6I3JVGGFOPUgZ/GvaNN1Vde+Gt/qW2RI4NLuJgu7JOMkA+5BoA/PPWbIWmpyxFQvOVwMDnkEfnTIbUgj8K2PGdtHHr80gGUun8xW9G2kE/jkZrNjG1gec0AX7a3GB8u70wM16T8JfgFP4wkh1C9WWOxXDQwn5WuCDnMjcFUOT3BI44zkP+z38OP+Ep8WpJOhbT9NJmlz0eT+BP1yT7A+or3P4lfEC3+HnheS8OJLmUlLaHuZGHH4Dqx9B70AeeeOdFs9BmuLPTrdILfUI1SaMD5pEUkx/8CXlue4OBkmvmO6DQ3BikGJEYpIccbgcGvc9Q8Qa14ojt7WWeUtqkxaSeTgA87mc9S7HJC9AeBxxXk3ja0+weJb+AdI7p1HsCSR+hoA+0rO4F7ZRTj/lrGr/mM18fftZWnleI9UwMbdQk/Nzn+tfWvgG5+1eA9Id+GezjP44wf1zXzf8AtcWZjs9ZYDLC8Vj742/0oA87+GXhyTxd45srFNwWSUPKw/gjHLMfoPzIHevUtfvpNb1ZlUs1ha/u4V9QOCA+P9rqfc+wrm/gVYRyR6heOAZcJFH9AST/AOg/nXSx+XvuM9J5PmJ7bcDP60AVlsRu71et9D3ZxzVttOAGO1WrWMEjjpQBBeeDzPpR2DLrn5e+a7TQdPjnsFVwGUxjIPr7Vl2UB8w4FdVoFsXwo6Z/pQB6d8L7Fbjwlp19n5l3Kw9txGf1ruPghqX9qafqmmnBaBwJB6hskH+f41w/gJvL8IrF6Xjj8CK6X4Oylfil9gJ+S9tpM+7Icj/0GgDxr9oXT/7A+M+vR7dqSypOvoNyLnH/AAIGuf0+xn1W9js7G3ku7qY7Y4Yhud29AP5+gr1b9tXw9/ZXxQE+Mf2lpsMze7KzRf8AslchpFja+F/C0MdvCgu71Viml53KpOZJM+pOEB9Ce1AHsXh/S4/Dnhux0+FAEtIVjBHTcBy34sSfxr5++NF8t74gvJAxZXncsp6jJ4/Svd9P1VG0eGQckRj6cDkfpXzN47vGm1SZnOWkdnOe5LZoA9w+B98tp8JfDxY9IGz/AMCZh/Wua/aV1AR6fqDEcC6j/wDQT/Wu2+GFr9n+GHh+P+7YxH/x0GuB/aHgD6bqIxn/AEtP5H/CgDy/w/4ubw7KVWLzoJT+8jY8HHRlPY/oeRXoFheJcxrJGwZGGQQea8sVua6TwHrsmi37wM/+jXBHX+GToG+h6H60Adhc2vI4rW0a3yDxVJ2yaUXbWnTA9KAOq0ePaVbsa67SZRbwl2IAUZJriNJ8QRPGNxwR0NdVZXkN9pUkUcgkzEcqDkjHUkdqAOq8G6r/AGro1tOM5mjBb2I4I/Ou3/ZYLXnjF5znN1pWH99u5xj/AOJrxewuXs2kiYnehDIcdweCK9p/ZN1iO48Z6tZqADMLa42judy5P4lRQB5J+1Jppt/i9fTFMDULGCdf+AwOuP8AvmvN9Pv20l7O6HW0uYpse4OT+mfyr1r9pXRw0WhagVwPNltXPuAGX+ZryF9KZ9NWMcnbj60Aes6tcvceG55h0eNFJ78g4/TP515J4lk/0s8fwr/Kuz0zxCL74dXNv/y8W5jQj0AXB/mPyrzzXrs+Zz1oA9S+GMoHw00wA/8ALB8/99GuS+P1yH0q4DHBe7UH8FNdR8KyP+FS0Dbkf6FMw+okx/Wuf+ONoW0JZsCMXTAn3wOf1oA8gAJqK+tRPFjHIqWMgdakboaAM7S9YutJfbFKVGflYHII9weleheF/EyeIrQJOyC6UAFMYDj0G7gH6jrnOa8xcFTVrStVl0mZXjYlMjcnccUAeiSaejTtHkpICcMhwwI78d/rXr37LXjGXSPibbad5pd9UheJE6FXGHDfh835V4bbX0d5GsiHhuh7j2rrvgh4gNh8X/D0gbCP9qgbI4/13l//AGVAH0h8ctFj1r4baokiAgQM/wDwJQSp/I147pl1NB4eiEn8OCo9x0r6U8c6euo+HdRhxlXt2B9mHIP5gV8xajB5NiVGQCDnvQBT/tecatFNGuQXXoe449vSvHNWuAkrE9ya9ftlTULbPSSI/N+FeA+ILN7G9miYYaNipH0oA93+GwVfBuljg5tUPH+0Nw/nXO/GwMvhuC4x/qrpT9AwIP8AM1f+G7Z8G6UA3/LiP0JAP6Gqvxpi/wCKbklHeBg36g/1oA8ZT70WPU1VsLxb2yjlU/K64Iq4hHTtzQBIwzTS2Dg04nHNMamSJJVDAggg9DRY3LWUwKkhexqMnHBpoJoA2bnxDFcQ7I2Y7PmDd2/pWx8JB9o+K3h+NGXEmpWqbj2XzBk/gK4Pf82e3SvWv2a/h7P4g8Y/23cRFdI0kEiRuFuLrsik9QvVj64X1NAH1D4g1iLSdMuruRgqQRszE+mM/wBa+W73xadQZ8nKnLKfevafjt48j1KO30ezeOaDe17d+WAViC5EceP4mLchcgBOudteK3jJHMV8s7YcIpOeeMn8O34UAei/DiVh4Ot48Y8oszj6kn+tefePdG+1+IHuFX5bhFkz6OPv/qCfxrtfh3etNoPlhsbCef513fDfxD4XvobiLaI5I9/PXPXn60AfOvhq9PhvXba+Thbefc3+7nDD8iavfE5zcaXK5PzXalh+A/8ArGofijoDaHrsipn7PMd8THnGeq/8BPH0x6UzxJdG88GRM/LQsYz/AJ9hQB55pxNvcmP+B/mX/PpW2gyciqMWniEbhwauRyYFAEgJzQTmmFiaA2aRJI3I4pma6Twz8KdW8UWsdzCkccEi5Qytu3f7wHQf1q1qHwK1qzQ+XHFc/wC7JtP5NimByQPtX1d+x58K/wDhFvCUviC8jC32urtiVhzFb/w/8CfBb3AX0ry74B/s+y+KZ49V1SNl0aFv3cJ4NywPG71Qd/X6c199WsNros9vZWdnZ2kEaiOKCKNURVA4CgcDgdBQBl6Zp1npcSxWlrbWsQGAsEYQfkBXmvxc+Ng0WdtB0Pypr8YF1dPykA/uj+856DsPWt34vfFW38GaVNp1g6Sa9dIUCr8wtlP8b+p/ur36nA5Px6/1WeW4ee6uJbi4mbdJLKxZ3Y9STQBNrt8ZdQnYku8ruzt1JLEkk/UmrFvEr2yjsI1H864WHWSI8M27dXaaTqsdxYRyJ1xz9R0NAHLfEH4dtrFub/T4wbxF/eRdDMP8R/T0NeXO0unXLRSxvHKjYZGGCDX0SbcDkVwXxP8AB0F7aNqlom25jH78L/y0Ud/94f40AcLZeIo5AAzbW9xir0V3HMMqwrnEjLr+73HipkJVty/KR1FAGxnNN3Y5qnBf8YP500374696QF7dzSGoDcHtSi5INAEfnOj7lJVh0ZTgj8a7Hw18aNZ0G3S2uJf7Stl4C3DZdR6K/wAw/HNeaGVy+7JJ9TUN1dbTQB6f4m+Lt54ktfItf9BsScyBTmSX/fc9voOBXDX94c5JrNFyxbJNNmuXYdaAHzT8VFHMzybVBYnoBTEjaaQIoyzHAFeg+CfBNv4eBu7tVl1Fh8o6rAPQep9T+VAEfgLwc+krJqN4oF5Mu2KM9YUPf/ePU+3HrW+6bh1qUESDimMCDQBRmiC8Gqd5EGRo2+8pKn6itSRPWs+8Taee1AHlvibS/wCxdXmh+7nkH+6en+fWs29Qw2sUw/gO1vw6GvSfFWifbrF1A+ZRuX644rzG/uP9GljPVCR+HH+FAGraSrLGGHarIlFYdheGSEE9cVKtzQBqbzTlkGKoLc9ql89KANBDJIAdxb3Jpu/Z1qG2uDnA+tTLh25oAilbNTaRpr3sySODtBwq+tQt8nWtDw9MJLlx/sD+dAHUWkCQRKigBVGAPSp8YFRoeKkHNAAQKTGaXpSUAIRWdqcPBrRzVa8j3D6UAcL4hsyyMcV5l4itSl8HPRgGH5YP9K9S1+2KsRiuA8SReVIcjj09s0AcrHMYJgw6g1YEg9ar3UZRyR3qJLoqfmH5UAa6Sg1IXzWWl7xnNSi5oA0Gk6VKl0V4xzWYLrNPExoA1FlqeCbZKD2rLSajzSM0A3ryTd2q8l1kVhJdZNWFuc0CH/9k=';
const SAMPLE_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyhpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTQ1IDc5LjE2MzQ5OSwgMjAxOC8wOC8xMy0xNjo0MDoyMiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKE1hY2ludG9zaCkiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6RTZGMEZFN0VDMTY4MTFFOTlBRjlBMkQwMTQ2OThBQjkiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6RTZGMEZFN0ZDMTY4MTFFOTlBRjlBMkQwMTQ2OThBQjkiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpFNkYwRkU3Q0MxNjgxMUU5OUFGOUEyRDAxNDY5OEFCOSIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpFNkYwRkU3REMxNjgxMUU5OUFGOUEyRDAxNDY5OEFCOSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PjCh5KMAAAztSURBVHja7JwJVFTXGcfHYQZQEBEUREAUUHGNohKsaDWK1qixxCbuxmOT2HjUHE/TNnbR1Gri0Ta2No2tNaknadvYmgKxNkbFFUQWBQEVEAVkR1ZlmOn9Zu59MAwDM8x7A/by5R6HYZj35r3f/e693/3ud9VarZZGqB9r6EZ4jBAeI4RHCOExQniEEB4hhMcI4RFCeIQQHiGExwjhEUJ4hBAeIYRHCOERQniMEB4hhEcI4RFCeIQQHiGERwjhMUJ4hBAeIYRHCOERQniMEB4hhEcI4RFCeIQQHiGERwjhMUJ4hBAeIYRHCOERQniMEHN0+vTpoUOHWvDucePGrVixwuYfb926NSoqSvIvWrRoxYoVH3744eLFi9va2lpaWvz8/CZOnIhPent7BwcH+/j4TJ48GcnLli2bN28e/FqlUtmMXRNCIPP8+fMWvBuSTp06ZfOP37t377p163A2bdo0nBw9ehSJaWlppaWlJSUldXV1jY2NarU6MDBw0qRJ8+fPj4yMvHTp0qVLl+bMmYPE1NRU+N7FDEorHPv379fSkZOTY9G7a2pqiouLL1++XFRUZMmLtdrMzEx8cV5enlQOvnPnzo0bN27duvX111+/9957r7322jvvvFOxb185rtDQUPj1zjvvHDx4sLGx0S4+sbSFqC9evGjBW8PCwiZMmDB+/HgvL6/BfKdGo0lPT8/JyWloaOjq6srKykpMTLS/DT527FhycnJ2dnZZWZlWyyl1d3cXFha6urqmpKQkJSXNnj07JCQkLCxs8uTJ/v7+TU1NCCzGjBnj4+sTGhrq5+c3ZswYT09P+O348ePvvffeLVu2mK3K5hGSmprq5+dnuoXcuXOnqqoqJyfn3r17ycnJ48aNM/P9ICQmJubo0aPwJPQYHf7YsWPhZXtaB+L348ePx8fHx8XF3bhxo76+vq2traurq7u7W6vVtLQIkXtbW1tjY2NBQcGBAwcQBqKVTJ06NTAw0MfHZ+LEiVFRUREREeHh4VFRUbgCGX379u1bt27ZgMrGhCBWQjBiuoWUlZWBkMbGxpMnTwYEBJj51cePH0eogJZRVlbW2NiIKhAU4MvDwsLefPNNu0QdYAIBOL4DV2/evKnVam/cuJGfn5+amnrixAkQ0tDQkPbEE29s2dLW1tbU1ISq2tvbO9p8fX3xF3x+1qxZCDcQtyMsRxvBW0aNGuXigqCMoqOjCwsLh5uQwsJCXx9fdU+PaSk4FhMTc+nSpczMzHA9KQaP+/fvw/f19fUdHR1gD6wB/q1bt27cuHGtra3h4eGvvvrqb9evf/bZZ5va2tAMa2trQUVra2tHR8fo0aPxRgTpFRUVxcXFoKWxsRF/Qe0gx8fHB4QgQkP0YXs3GRYhp0+fnjZtmlqt7unpMUVIa2trXl5eRUVFfHx8ZGSkWV9dVVWFltTQ0KDRaEAO2kBKSkpLS0tISMivfvUrsMC6OYANhAZt7e2ICDo6OkAICEHLBBX4L2iwfWBsGCGIpuEiMwlRqVQZGRmZmZkxMTFLliypqalJTU0FCZCKSKCsrOzdd9+9c+fO5MmTYRPLly+fOXMmrpuhpqam5vLly4hV0tLSXnvtNfw9IyNj3759Y8eORWyA/x4/fnzy5MnQSnTv4uLi4+ODcAT+xYG4EZ9ZW1ubm5uL4BoNCm+ZNm3azJkzx48f39DQgNBGYrFNCEF/PnjwYFNTk+mE1NbWpqenI6q9evVqV1dXQkLCmDFjgA6CcfSwmJgYtK4NGzbMmzcPlRw5ciQ9PX3+/PmrVq2aPHkyOjOwgOMbGxvxh4yMjPT09L/85S+zZ8/29/fHRwJ9pJjcLdu3b0d0DT8itDh16lROTg46HhoLohD0ZPBZVlaGKAUhK5iYMWNGSEhIX3PtYQiZ3MfXj8qycvAGBq7ZiBDEdOjaKpXKdELQJ1EDbOrBgweIBRAUoBqEBSUlJbW1tfAAugeuXrx4EbSjVWzZsiU3NzcvLw+EfPjhh5s3b0Y9JSUleCnYAxXt7e0gdOnSpW+//XZMTMyvf/3rnj17du/eDYYR3SDURgMBFWgbePC9996rrKxcsWLFnDlzNm7c+NFHHz3//PMwrsOHD8N9aBYpKSk4WUZIMkUSQlv0bQKEIzNnzpwxY4aZXblvJ7h586aZ9SCQBgnwCKpEeA8e1q5dC/d9+umniDEQcCCqg+9QAxoLmldNTQ1qiIqKwnuDg4PHjh2LaP7q1avZ2dkpKSn4CDQQRBf5+fkdHR3e3t6I6FE/EvHeo0ePIonI4+zZs1OnTrWVDEFG0JB5DSg8PNxM697WLfTZUaNGRUZGLly4EAr+/ve/o7MnJSWhFYCcpqYm+BrlYAIJISEhEJrXypUr4W8E7XAcQnuQcP78+YiIiOeff/6DDz7Ytm0bDMwzzzyD8D49PR1vRDM6dOjQO++8M3ny5I0bN6am7oUqmYQwQvTl5eUlEVJbW2u0qJ1aiBU1wB3o8ogO4OvDhw/DYUhBRAfGcI2FIHQJIuGVxYsXgy1UiArABGJ7tKP169cvWbIEHQYpf/7zn3fu3ImA+qWXXlr38stIgSqhZnQYkIzGlZGRYY+0iJLRFiIVlZWVBhZtb+/w9PSk5qZGeysydB18reiCsBA4HqE9+jYYQFCNK2h0uAbLCaEFggL8E0wASBR8/fXXEVAjJEFo8corr6xdu3bdunWI3vFe6cGKioqPP/4YSVg2Vl5ertYxrGiIqR0JsRRt2gRCurS0NDi7HTFYq9VqamtrJfVCMiih/bZwpnkYA5SgIeLDECzW19dXV1fDiQiZQQWcjvIpKSkhISFIQeSAnweN0eBc1NbW4i9SUJKV9RNYSOlJsGITQubOnQtNQNPv7OwUKDC0KCzk3r17FRUV9hLQGYSlX68kNM7gmCRE0FVV5XorAxMeHh5Iffjhh1999RUiPF9f35dffllKRyaY4IGJsLAwRHCIXd59993CwsKYmJjIyEgfHx80NGQ0kWZD+1uFELQHMFHX2KTVavo0BIGLLi9G4J2dnQ6RRDOMnhjsoQjRHIwcPHhwz549a9asgQbGxcW99dZbW7duLSgoQNyx+KeIrq2tdf3pxqKHDx+iYhyRkZEIZP70pz9BW2Eh8HdPT4+Xl5eiFTHkDdVNSUJKSkqEQaivFyjQE4JLJg6DfwFxeXm5Q5i+YTa8vLyqqqrS0tK2b9++Zs0a9PD4+Pg9e/YgCkfLQMCRmJgIw1lRUZGamnrixIna2jr0bFiONm2iVTEiqqqq9uzZg3eEh4cjuIZh8vX1BeeGJEFLKRTRFuB4tBMjhLhUVlYaCLcXISCku7tbTlVXV1dlRYWwKA7Z1LbELOFk/DM7OzsvL2/Tpk2ISRYtWrRr1y5k8+BrBO8XL17E4/c+ekT9cB+NwHDm5+efOHEC1yCktbUV0QsehvCYjw/iqcEQoplIiI+3D91sR0JQ4sSJE0YLTps2zdPDk5qbOtq0sA1/f3/Ha5aZmQlCVq9ePWvWLISsiYmJCBNACK7X1dVVVlZeuHABJhR+RuxhkJGdPHkyTCgChf7ixcGklYbFQmprayMnRw6wkGnTpoWEhnl4eHZ1do4dO3bMmDHGXoR4+/bt2/X19Y0bN0ITnALpCQkJaCTnzp07evQo3AqvwgXYNjJwHy/nzP3M5lDxENPU1NjYMP6Jp8yKshAVp6enZ2Zm3rhxA7rpXLRu3bpt27YdOXLkm2++OXPmzI0bN9BMEB+hhz/M+omS0tLSvLy81NTUtLQ0xFZ4o5tQf3drK24mW73OJVnIurVr0UM9PT27OrtMtxAMc9DfXV1dq6uro6OjnQtf5Bx3796NR3l5+dmzZ5FZzcvLy83NRcwBg4tQ4+zZs2gDaANVVVUITy5dupSWlgaq/Pz8YBjRWxGvt7a2yqPFJSUluVlZtM0J0RYVFYWFhdlmWJqTwxCMAB0uRbR64sQJxNzl5eX4b0lJyc2bN9HrQRUeXxC/Hzt2DO0ACXfEm7xPnDhp5swZhYWFaCSm9evhISTc/snZmjhx4uTJk5EbB2MYc4ExcvXyHvSbgZBQPqnx90vDIeDTaTFmzBiHzIaYBYpHKJ+2F0KFoVPUoxUIdaOiov61a1fvQpQXVk15/EmM65o+bqBnzJjxj507e9dlf0Le/clz+/bte/bZZw2GzZTmEOKQYMb3Oa59Y3Tjr3Dn6wGBFmJDIAAVm9rU1PTHjz62qyVVtiKzD4PFkCPTa6hXgbEVg0aTw1M2GtczHImKUGMBjWhDCH0l1UyiTlS8Ef8UQklnxcWLF+N4YmxstLgdFZBYVF9fR4wQJRLitmPHDhcXF0dNoG7fvn3hwoV0nx1GnV6Il5XSaXk1NbUvvviiYs0iYiznN0Ic2zKcGTt37uzphXgjxAlCi5HUZ0YID/+/CBkhxNExQgjPCCE8QgiPEMIjhPAIITxCCI8QwiOE8AghvBFCeIQQHiGERwjhEUJ4hBAeIYRHCOERQniEEB4hhMcI4RFC/vt/AQYAfjmMwAJOjpAAAAAASUVORK5CYII=';
const SAMPLE_WEBP = 'data:image/webp;base64,UklGRlIAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAIAAAAAkFZQOCAYAAAAMAEAnQEqAQABAAIAyCwJAB0KiAAAAAA=';

// Invalid formats for testing
const SAMPLE_HEIC = 'data:image/heic;base64,AAAAHGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDIAAAAIZnJlZQAAAs1tZGF0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOgUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAVMDTstUQW5kcm9pZCAyIENvbnN0YW50cyBBQUNMIEVuY29kZXIgdjEuMS4wAP7/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAEAAQDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/wD/2Q==';
const SAMPLE_BMP = 'data:image/bmp;base64,Qk0uAAAAAAAAADYAAAAoAAAAAQAAAAEAAAABABgAAAAAAAAAAADDDgAAww4AAAAAAAAAAAAA////AA==';
const SAMPLE_SVG = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIzIiBmaWxsPSJyZWQiIC8+PC9zdmc+';

// Cookie jar to store session cookie between requests
let sessionCookie = null;
let createdLocationId = null;

/**
 * Helper function to extract and store session cookie
 * @param {object} response - Axios response object
 */
function storeSessionCookie(response) {
  const setCookieHeader = response.headers['set-cookie'];
  if (setCookieHeader && setCookieHeader.length > 0) {
    // Extract the session cookie
    const cookies = setCookieHeader[0].split(';');
    sessionCookie = cookies[0]; // Format: sessionId=value
    console.log('Session cookie stored:', sessionCookie);
  }
}

/**
 * Test 1: Login and session creation
 */
async function testLogin() {
  console.log('\n🔑 TEST 1: Login and Session Creation');
  console.log('--------------------------------------');
  
  try {
    console.log(`POST ${API_BASE_URL}/verify-access`);
    console.log('Request body:', { accessCode: ACCESS_CODE });
    
    const response = await axios.post(`${API_BASE_URL}/verify-access`, {
      accessCode: ACCESS_CODE
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Response data:', response.data);
    
    // Store session cookie for subsequent requests
    storeSessionCookie(response);
    
    // Check if login was successful
    if (response.status === 200 && !response.data.error) {
      console.log('✅ Login successful');
      return true;
    } else {
      console.log('❌ Login failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error during login test:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
    } else {
      console.error(error.message);
    }
    return false;
  }
}

/**
 * Test 2: Create a test location to upload an image to
 */
async function testCreateLocation() {
  console.log('\n📍 TEST 2: Create Test Location');
  console.log('------------------------------');
  
  const testLocation = {
    title: "Formatvalidierungstest",
    description: "Ein Testeintrag für den Formatvalidierungstest",
    latitude: 48.1351,
    longitude: 11.5820,
    date: new Date().toISOString().split('T')[0]
  };
  
  try {
    console.log(`POST ${API_BASE_URL}/api/locations`);
    console.log('Request body:', testLocation);
    
    const response = await axios.post(
      `${API_BASE_URL}/api/locations`, 
      testLocation, 
      { 
        headers: sessionCookie ? { Cookie: sessionCookie } : {},
      }
    );
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Response data:', response.data);
    
    // Check if creation was successful
    if ((response.status === 201 || response.status === 200) && !response.data.error) {
      console.log('✅ Location created successfully');
      // Store the ID of the created location for later tests
      createdLocationId = response.data.data.id;
      console.log(`Created location ID: ${createdLocationId}`);
      return true;
    } else {
      console.log('❌ Location creation failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error during location creation test:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
    } else {
      console.error(error.message);
    }
    return false;
  }
}

/**
 * Test 3: Positive test - Upload allowed formats (JPEG)
 */
async function testUploadJpeg() {
  console.log('\n🖼️ TEST 3: Upload JPEG Image');
  console.log('---------------------------');
  
  if (!createdLocationId) {
    console.error('❌ No location ID available for testing. Previous test may have failed.');
    return false;
  }
  
  try {
    console.log(`POST ${API_BASE_URL}/api/locations/${createdLocationId}/upload`);
    console.log('Request body: { imageData: [JPEG data], fileName: "test-image.jpg" }');
    
    const response = await axios.post(
      `${API_BASE_URL}/api/locations/${createdLocationId}/upload`,
      {
        imageData: SAMPLE_JPEG,
        fileName: 'test-image.jpg'
      },
      { 
        headers: sessionCookie ? { 
          Cookie: sessionCookie,
          'Content-Type': 'application/json' 
        } : {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Response data:', response.data);
    
    // Check if upload was successful
    if (response.status === 200 && !response.data.error) {
      console.log('✅ JPEG image uploaded successfully');
      return true;
    } else {
      console.log('❌ JPEG image upload failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error during JPEG image upload test:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
    } else {
      console.error(error.message);
    }
    return false;
  }
}

/**
 * Test 4: Positive test - Upload allowed formats (PNG)
 */
async function testUploadPng() {
  console.log('\n🖼️ TEST 4: Upload PNG Image');
  console.log('--------------------------');
  
  if (!createdLocationId) {
    console.error('❌ No location ID available for testing. Previous test may have failed.');
    return false;
  }
  
  try {
    console.log(`POST ${API_BASE_URL}/api/locations/${createdLocationId}/upload`);
    console.log('Request body: { imageData: [PNG data], fileName: "test-image.png" }');
    
    const response = await axios.post(
      `${API_BASE_URL}/api/locations/${createdLocationId}/upload`,
      {
        imageData: SAMPLE_PNG,
        fileName: 'test-image.png'
      },
      { 
        headers: sessionCookie ? { 
          Cookie: sessionCookie,
          'Content-Type': 'application/json' 
        } : {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Response data:', response.data);
    
    // Check if upload was successful
    if (response.status === 200 && !response.data.error) {
      console.log('✅ PNG image uploaded successfully');
      return true;
    } else {
      console.log('❌ PNG image upload failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error during PNG image upload test:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
    } else {
      console.error(error.message);
    }
    return false;
  }
}

/**
 * Test 5: Positive test - Upload allowed formats (WebP)
 */
async function testUploadWebP() {
  console.log('\n🖼️ TEST 5: Upload WebP Image');
  console.log('---------------------------');
  
  if (!createdLocationId) {
    console.error('❌ No location ID available for testing. Previous test may have failed.');
    return false;
  }
  
  try {
    console.log(`POST ${API_BASE_URL}/api/locations/${createdLocationId}/upload`);
    console.log('Request body: { imageData: [WebP data], fileName: "test-image.webp" }');
    
    const response = await axios.post(
      `${API_BASE_URL}/api/locations/${createdLocationId}/upload`,
      {
        imageData: SAMPLE_WEBP,
        fileName: 'test-image.webp'
      },
      { 
        headers: sessionCookie ? { 
          Cookie: sessionCookie,
          'Content-Type': 'application/json' 
        } : {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Response data:', response.data);
    
    // Check if upload was successful
    if (response.status === 200 && !response.data.error) {
      console.log('✅ WebP image uploaded successfully');
      return true;
    } else {
      console.log('❌ WebP image upload failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error during WebP image upload test:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
    } else {
      console.error(error.message);
    }
    return false;
  }
}

/**
 * Test 6: Negative test - Upload disallowed format (HEIC)
 */
async function testUploadHeic() {
  console.log('\n🛑 TEST 6: Upload HEIC Image (Should Fail)');
  console.log('---------------------------------------');
  
  if (!createdLocationId) {
    console.error('❌ No location ID available for testing. Previous test may have failed.');
    return false;
  }
  
  try {
    console.log(`POST ${API_BASE_URL}/api/locations/${createdLocationId}/upload`);
    console.log('Request body: { imageData: [HEIC data], fileName: "test-image.heic" }');
    
    const response = await axios.post(
      `${API_BASE_URL}/api/locations/${createdLocationId}/upload`,
      {
        imageData: SAMPLE_HEIC,
        fileName: 'test-image.heic'
      },
      { 
        headers: sessionCookie ? { 
          Cookie: sessionCookie,
          'Content-Type': 'application/json' 
        } : {
          'Content-Type': 'application/json'
        },
        validateStatus: function (status) {
          return status >= 200 && status < 500;
        }
      }
    );
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Response data:', response.data);
    
    // Check if validation properly rejected the HEIC format
    if (response.status === 400 && response.data.error) {
      console.log('✅ HEIC format correctly rejected');
      // Check for specific error message
      if (response.data.message === 'Ungültiges Dateiformat. Nur JPG, PNG und WebP sind erlaubt.') {
        console.log('✅ Correct error message returned');
        return true;
      } else {
        console.log('❌ Error message does not match expected format');
        return false;
      }
    } else {
      console.log('❌ HEIC format was not properly rejected');
      return false;
    }
  } catch (error) {
    console.error('❌ Error during HEIC format test:');
    console.error(error.message);
    return false;
  }
}

/**
 * Test 7: Negative test - Upload disallowed format (BMP)
 */
async function testUploadBmp() {
  console.log('\n🛑 TEST 7: Upload BMP Image (Should Fail)');
  console.log('--------------------------------------');
  
  if (!createdLocationId) {
    console.error('❌ No location ID available for testing. Previous test may have failed.');
    return false;
  }
  
  try {
    console.log(`POST ${API_BASE_URL}/api/locations/${createdLocationId}/upload`);
    console.log('Request body: { imageData: [BMP data], fileName: "test-image.bmp" }');
    
    const response = await axios.post(
      `${API_BASE_URL}/api/locations/${createdLocationId}/upload`,
      {
        imageData: SAMPLE_BMP,
        fileName: 'test-image.bmp'
      },
      { 
        headers: sessionCookie ? { 
          Cookie: sessionCookie,
          'Content-Type': 'application/json' 
        } : {
          'Content-Type': 'application/json'
        },
        validateStatus: function (status) {
          return status >= 200 && status < 500;
        }
      }
    );
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Response data:', response.data);
    
    // Check if validation properly rejected the BMP format
    if (response.status === 400 && response.data.error) {
      console.log('✅ BMP format correctly rejected');
      // Check for specific error message
      if (response.data.message === 'Ungültiges Dateiformat. Nur JPG, PNG und WebP sind erlaubt.') {
        console.log('✅ Correct error message returned');
        return true;
      } else {
        console.log('❌ Error message does not match expected format');
        return false;
      }
    } else {
      console.log('❌ BMP format was not properly rejected');
      return false;
    }
  } catch (error) {
    console.error('❌ Error during BMP format test:');
    console.error(error.message);
    return false;
  }
}

/**
 * Test 8: Negative test - Upload disallowed format (SVG)
 */
async function testUploadSvg() {
  console.log('\n🛑 TEST 8: Upload SVG Image (Should Fail)');
  console.log('--------------------------------------');
  
  if (!createdLocationId) {
    console.error('❌ No location ID available for testing. Previous test may have failed.');
    return false;
  }
  
  try {
    console.log(`POST ${API_BASE_URL}/api/locations/${createdLocationId}/upload`);
    console.log('Request body: { imageData: [SVG data], fileName: "test-image.svg" }');
    
    const response = await axios.post(
      `${API_BASE_URL}/api/locations/${createdLocationId}/upload`,
      {
        imageData: SAMPLE_SVG,
        fileName: 'test-image.svg'
      },
      { 
        headers: sessionCookie ? { 
          Cookie: sessionCookie,
          'Content-Type': 'application/json' 
        } : {
          'Content-Type': 'application/json'
        },
        validateStatus: function (status) {
          return status >= 200 && status < 500;
        }
      }
    );
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Response data:', response.data);
    
    // Check if validation properly rejected the SVG format
    if (response.status === 400 && response.data.error) {
      console.log('✅ SVG format correctly rejected');
      // Check for specific error message
      if (response.data.message === 'Ungültiges Dateiformat. Nur JPG, PNG und WebP sind erlaubt.') {
        console.log('✅ Correct error message returned');
        return true;
      } else {
        console.log('❌ Error message does not match expected format');
        return false;
      }
    } else {
      console.log('❌ SVG format was not properly rejected');
      return false;
    }
  } catch (error) {
    console.error('❌ Error during SVG format test:');
    console.error(error.message);
    return false;
  }
}

/**
 * Test 9: Clean up by deleting the test location
 */
async function testCleanUp() {
  console.log('\n🧹 TEST 9: Clean Up');
  console.log('------------------');
  
  if (!createdLocationId) {
    console.error('❌ No location ID available for clean up. Previous tests may have failed.');
    return false;
  }
  
  try {
    console.log(`DELETE ${API_BASE_URL}/api/locations/${createdLocationId}`);
    
    const response = await axios.delete(
      `${API_BASE_URL}/api/locations/${createdLocationId}`,
      { 
        headers: sessionCookie ? { Cookie: sessionCookie } : {}
      }
    );
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Response data:', response.data);
    
    // Check if deletion was successful
    if (response.status === 200 && !response.data.error) {
      console.log('✅ Test location deleted successfully');
      return true;
    } else {
      console.log('❌ Test location deletion failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error during clean up test:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
    } else {
      console.error(error.message);
    }
    return false;
  }
}

/**
 * Run all tests in sequence
 */
async function runTests() {
  console.log('🧪 STARTING FORMAT VALIDATION TESTS');
  console.log('=================================');
  console.log(`Server URL: ${API_BASE_URL}`);
  console.log(`Access Code configured: ${ACCESS_CODE ? 'Yes' : 'No'}`);
  
  try {
    // Test 1: Login
    const loginSuccess = await testLogin();
    if (!loginSuccess) {
      console.error('❌ Login failed, aborting remaining tests');
      return;
    }
    
    // Test 2: Create Location
    const createSuccess = await testCreateLocation();
    if (!createSuccess) {
      console.error('❌ Create location failed, aborting remaining tests');
      return;
    }
    
    // Positive tests - allowed formats
    await testUploadJpeg();
    await testUploadPng();
    await testUploadWebP();
    
    // Negative tests - disallowed formats
    await testUploadHeic();
    await testUploadBmp();
    await testUploadSvg();
    
    // Test 9: Clean Up
    await testCleanUp();
    
    console.log('\n🏁 ALL FORMAT VALIDATION TESTS COMPLETED');
  } catch (error) {
    console.error('\n💥 UNHANDLED ERROR DURING TESTS:');
    console.error(error);
  }
}

// Check for ACCESS_CODE before running tests
if (!ACCESS_CODE) {
  console.error('❌ ACCESS_CODE environment variable is not set. Tests will likely fail.');
  console.error('Please set the ACCESS_CODE environment variable and try again.');
  process.exit(1);
}

// Run the tests
runTests();